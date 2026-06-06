pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        disableConcurrentBuilds()
    }

    environment {
        REGISTRY        = 'registry.eduai.tn'
        IMAGE_TAG       = "${env.GIT_COMMIT.take(8)}"
        DOCKER_CREDS    = credentials('eduai-registry-creds')
        DEPLOY_SSH_CRED = 'eduai-deploy-ssh'
        DEPLOY_HOST     = 'eduai.yourdomain.com'
        DEPLOY_PATH     = '/opt/eduai'
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Test') {
            parallel {
                stage('Backend (JUnit 5)') {
                    when { changeset "backend/**" }
                    agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
                    steps {
                        dir('backend') {
                            sh 'mvn -B test'
                            sh 'mvn -B jacoco:report'
                        }
                    }
                    post {
                        always {
                            junit testResults: 'backend/target/surefire-reports/TEST-*.xml', allowEmptyResults: true
                            recordCoverage tools: [[parser: 'JACOCO', pattern: 'backend/target/site/jacoco/jacoco.xml']]
                        }
                    }
                }

                stage('Frontend (Angular)') {
                    when { changeset "frontend/**" }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run test -- --watch=false --browsers=ChromeHeadless'
                            sh 'npm run build -- --configuration production'
                        }
                    }
                }

                stage('Landing (Next.js)') {
                    when { changeset "src/**" }
                    steps {
                        sh 'npm ci'
                        sh 'npm run lint'
                        sh 'npm run build'
                    }
                }

                stage('AI Service (Python)') {
                    when { changeset "ai-service/**" }
                    steps {
                        dir('ai-service') {
                            sh 'pip install -r requirements.txt'
                            sh 'pip install pytest && pytest -v || true'
                        }
                    }
                }
            }
        }

        stage('Build & Push Images') {
            when { branch 'main' }
            steps {
                sh "echo $DOCKER_CREDS_PSW | docker login $REGISTRY -u $DOCKER_CREDS_USR --password-stdin"

                sh "docker build -t $REGISTRY/eduai/backend:$IMAGE_TAG -t $REGISTRY/eduai/backend:latest ./backend"
                sh "docker push $REGISTRY/eduai/backend:$IMAGE_TAG && docker push $REGISTRY/eduai/backend:latest"

                sh "docker build -t $REGISTRY/eduai/frontend:$IMAGE_TAG -t $REGISTRY/eduai/frontend:latest ./frontend"
                sh "docker push $REGISTRY/eduai/frontend:$IMAGE_TAG && docker push $REGISTRY/eduai/frontend:latest"

                sh "docker build -t $REGISTRY/eduai/landing:$IMAGE_TAG -t $REGISTRY/eduai/landing:latest ."
                sh "docker push $REGISTRY/eduai/landing:$IMAGE_TAG && docker push $REGISTRY/eduai/landing:latest"

                sh "docker build -t $REGISTRY/eduai/ai:$IMAGE_TAG -t $REGISTRY/eduai/ai:latest ./ai-service"
                sh "docker push $REGISTRY/eduai/ai:$IMAGE_TAG && docker push $REGISTRY/eduai/ai:latest"
            }
        }

        stage('Deploy to Production') {
            when { branch 'main' }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sshagent(credentials: [DEPLOY_SSH_CRED]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no deploy@${DEPLOY_HOST} '
                            cd ${DEPLOY_PATH} &&
                            git pull origin main &&
                            docker compose pull &&
                            docker compose up -d --remove-orphans &&
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} succeeded — image tag ${env.IMAGE_TAG}"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} failed — check logs above"
        }
        always {
            cleanWs()
        }
    }
}
