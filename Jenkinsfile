pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES')
    }

    environment {
        REGISTRY        = credentials('docker-registry-url')
        DOCKER_CREDS    = credentials('docker-registry-creds')
        NEXUS_URL       = credentials('nexus-url')
        SONAR_TOKEN     = credentials('sonar-token')
        SONAR_HOST_URL  = credentials('sonar-host-url')
        DEPLOY_SSH_CRED = 'eduai-deploy-ssh'
        DEPLOY_HOST     = credentials('deploy-host')
        DEPLOY_PATH     = '/opt/eduai'
        IMAGE_TAG       = "${env.GIT_COMMIT?.take(8) ?: 'latest'}"
        APP_VERSION     = "1.0.${BUILD_NUMBER}-SNAPSHOT"
    }

    stages {

        // 1. CHECKOUT
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log --oneline -3'
                echo "Branch: ${env.BRANCH_NAME} | Tag: ${IMAGE_TAG}"
            }
        }

        // 2. BUILD BACKEND
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './mvnw clean compile -DskipTests -q'
                }
            }
        }

        // 3. UNIT TESTS (parallel)
        stage('Unit Tests') {
            parallel {

                stage('Backend Unit Tests') {
                    steps {
                        dir('backend') {
                            sh './mvnw test -Dgroups=!integration'
                        }
                    }
                    post {
                        always {
                            junit testResults: 'backend/target/surefire-reports/TEST-*.xml',
                                  allowEmptyResults: true
                            jacoco(
                                execPattern: 'backend/target/jacoco.exec',
                                classPattern: 'backend/target/classes',
                                sourcePattern: 'backend/src/main/java',
                                exclusionPattern: '**/dto/**,**/model/enums/**,**/*Application*,**/DataInitializer*'
                            )
                        }
                    }
                }

                stage('Frontend Unit Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci --prefer-offline'
                            sh 'npx ng test --no-watch --reporters=junit --outputFile=test-results.xml'
                        }
                    }
                    post {
                        always {
                            junit testResults: 'frontend/test-results.xml',
                                  allowEmptyResults: true
                        }
                    }
                }

                stage('AI Service Tests') {
                    steps {
                        dir('ai_service') {
                            sh 'pip install -r requirements.txt --quiet'
                            sh 'pip install pytest pytest-cov --quiet'
                            sh 'pytest tests/ -v --cov=. --cov-report=xml:coverage.xml || true'
                        }
                    }
                    post {
                        always {
                            junit testResults: 'ai_service/test-results.xml', allowEmptyResults: true
                        }
                    }
                }
            }
        }

        // 4. INTEGRATION TESTS
        stage('Integration Tests') {
            steps {
                dir('backend') {
                    sh './mvnw verify -DskipUnitTests -Pfailsafe'
                }
            }
            post {
                always {
                    junit testResults: 'backend/target/failsafe-reports/TEST-*.xml',
                          allowEmptyResults: true
                }
            }
        }

        // 5. SONARQUBE ANALYSIS
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    dir('backend') {
                        sh """
                            ./mvnw sonar:sonar \
                              -Dsonar.projectKey=eduai-lms \
                              -Dsonar.projectName='EduAI LMS' \
                              -Dsonar.host.url=${SONAR_HOST_URL} \
                              -Dsonar.token=${SONAR_TOKEN} \
                              -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml \
                              -Dsonar.exclusions=**/DataInitializer.java,**/dto/**,**/model/enums/**,**/*Application.java \
                              -q
                        """
                    }
                }
            }
        }

        // 6. QUALITY GATE
        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // 7. NEXUS ARTIFACT PUBLISH
        stage('Publish to Nexus') {
            when { branch pattern: 'main|adib|sarrah|chaima', comparator: 'REGEXP' }
            steps {
                dir('backend') {
                    sh """
                        ./mvnw deploy -DskipTests \
                          -Drevision=${APP_VERSION} \
                          -DaltDeploymentRepository=nexus-snapshots::default::${NEXUS_URL}/repository/maven-snapshots/
                    """
                }
            }
        }

        // 8. BUILD & PUSH DOCKER IMAGES
        stage('Build Docker Images') {
            when { branch pattern: 'main|adib|sarrah|chaima', comparator: 'REGEXP' }
            steps {
                script {
                    sh "echo ${DOCKER_CREDS_PSW} | docker login ${REGISTRY} -u ${DOCKER_CREDS_USR} --password-stdin"
                    parallel(
                        backend: {
                            sh "docker build -t ${REGISTRY}/eduai-backend:${IMAGE_TAG} ./backend"
                            sh "docker push ${REGISTRY}/eduai-backend:${IMAGE_TAG}"
                        },
                        frontend: {
                            sh "docker build -t ${REGISTRY}/eduai-frontend:${IMAGE_TAG} ./frontend"
                            sh "docker push ${REGISTRY}/eduai-frontend:${IMAGE_TAG}"
                        },
                        ai: {
                            sh "docker build -t ${REGISTRY}/eduai-ai:${IMAGE_TAG} ./ai_service"
                            sh "docker push ${REGISTRY}/eduai-ai:${IMAGE_TAG}"
                        }
                    )
                }
            }
        }

        // 9. DEPLOY
        stage('Deploy') {
            when { branch 'main' }
            steps {
                input message: "Deploy ${IMAGE_TAG} to production?", ok: 'Deploy'
                sshagent(credentials: [DEPLOY_SSH_CRED]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no deploy@${DEPLOY_HOST} '
                            cd ${DEPLOY_PATH} &&
                            export IMAGE_TAG=${IMAGE_TAG} &&
                            docker compose pull &&
                            docker compose up -d --remove-orphans &&
                            docker image prune -f
                        '
                    """
                }
            }
        }

        // 10. OWASP ZAP SECURITY SCAN
        stage('OWASP ZAP Scan') {
            when { branch pattern: 'main|adib|sarrah|chaima', comparator: 'REGEXP' }
            steps {
                sh 'mkdir -p zap-reports'
                sh """
                    docker run --rm \
                      -v \$(pwd)/zap-reports:/zap/wrk:rw \
                      --network host \
                      ghcr.io/zaproxy/zaproxy:stable \
                      zap-api-scan.py \
                        -t http://localhost:8080/api/v3/api-docs \
                        -f openapi \
                        -r zap-report.html \
                        -J zap-report.json \
                        -z "-config scanner.attackStrength=LOW" \
                        -l WARN || true
                """
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'zap-reports',
                        reportFiles: 'zap-report.html',
                        reportName: 'OWASP ZAP Security Report'
                    ])
                    archiveArtifacts artifacts: 'zap-reports/zap-report.json', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} (${IMAGE_TAG}) succeeded on ${env.BRANCH_NAME}"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} FAILED on ${env.BRANCH_NAME}"
        }
        always {
            cleanWs(
                cleanWhenNotBuilt: false,
                deleteDirs: true,
                disableDeferredWipeout: true,
                notFailBuild: true,
                patterns: [[pattern: '**/node_modules', type: 'EXCLUDE']]
            )
        }
    }
}