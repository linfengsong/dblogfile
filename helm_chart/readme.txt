backend>mvnw install
backend/mvnw spring-boot:run
docker build -t backend:latest .

node server.js
frontend/docker build -t frontend:latest .

helm install backend ./backend

helm install --create-namespace --namespace hello-kubernetes hello-world /mnt/c/dev/helm_chart/hello-kubernetes-main/deploy/helm/hello-kubernetes

cd helm/backend
helm package .
curl -u admin:xxxx http://192.168.1.135:8081/repository/helm/ --upload-file backend-1.0.2.tgz

helm repo add repo http://192.168.1.135:8081/repository/helm/ --username admin --password xxxx

helm dependency update .

https://developer.hashicorp.com/terraform/install
extract to bin for both window and linux

#terraform apply -var=nexus_username=admin -var=nexus_password=xxxx -auto-approve
#terraform destroy -var=nexus_username=admin -var=nexus_password=xxxx -auto-approve
export TF_VAR_nexus_username=admin
export TF_VAR_nexus_password=weiqing
export TF_VAR_chart_version="0.1.0"
terraform apply -auto-approve
terraform destroy -auto-approve
