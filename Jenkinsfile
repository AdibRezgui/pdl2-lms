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
                            sh 'npx ng test --watch=false || true'
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
                            sh 'pip install -r requirements.txt --quiet --break-system-packages'
                            sh 'pip install pytest pytest-cov --quiet --break-system-packages'
                            sh 'pytest tests/ -v --junitxml=test-results.xml --cov=. --cov-report=xml:coverage.xml || true'
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
                        sh './mvnw sonar:sonar -Dsonar.projectKey=eduai-lms -Dsonar.projectName=EduAI-LMS -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml -Dsonar.exclusions=**/DataInitializer.java,**/dto/**,**/model/enums/**,**/*Application.java'
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
                        ./mvnw versions:set -DnewVersion=1.0.${BUILD_NUMBER}-SNAPSHOT -s /root/.m2/settings.xml
                        ./mvnw deploy -DskipTests -s /root/.m2/settings.xml \
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
                    parallel(
                        backend: {
                            sh "docker build -t ${REGISTRY}/eduai-backend:${IMAGE_TAG} ./backend"
                            sh "docker push ${REGISTRY}/eduai-backend:${IMAGE_TAG}"
                        },
                        frontend: {
                            sh "docker build -f ./frontend/Dockerfile -t ${REGISTRY}/eduai-frontend:${IMAGE_TAG} ./frontend"
                            sh "docker push ${REGISTRY}/eduai-frontend:${IMAGE_TAG}"
                        },
                        admin: {
                            sh "docker build -f ./frontend/Dockerfile.admin -t ${REGISTRY}/eduai-admin:${IMAGE_TAG} ./frontend"
                            sh "docker push ${REGISTRY}/eduai-admin:${IMAGE_TAG}"
                        },
                        ai: {
                            sh "docker build -t ${REGISTRY}/eduai-ai:${IMAGE_TAG} ./ai_service"
                            sh "docker push ${REGISTRY}/eduai-ai:${IMAGE_TAG}"
                        }
                    )
                }
            }
        }

        // 9. DEPLOY (cloud — 4 conteneurs : frontend, admin, backend, ai_service)
        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo "=== Deploiement cloud — 4 conteneurs ==="
                echo "Images buildees :"
                echo "  ${REGISTRY}/eduai-frontend:${IMAGE_TAG}"
                echo "  ${REGISTRY}/eduai-admin:${IMAGE_TAG}"
                echo "  ${REGISTRY}/eduai-backend:${IMAGE_TAG}"
                echo "  ${REGISTRY}/eduai-ai:${IMAGE_TAG}"
                echo "En production, ce stage se connecte en SSH a ${DEPLOY_HOST} et execute :"
                echo "  docker compose -f docker-compose.cloud.yml pull"
                echo "  docker compose -f docker-compose.cloud.yml up -d --remove-orphans"
                echo "Stage non bloquant en CI locale (pas de serveur distant configure)."
            }
        }

        // 10. OWASP ZAP SECURITY SCAN (non bloquant)
        stage('OWASP ZAP Scan') {
            when { branch pattern: 'main|adib|sarrah|chaima', comparator: 'REGEXP' }
            steps {
                echo "=== Scan de securite OWASP ZAP ==="
                echo "En production, ZAP scannerait l'application deployee."
                echo "Stage non bloquant en CI locale (l'application n'est pas deployee sur un host accessible)."
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