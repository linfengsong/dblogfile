
terraform {
  required_providers {
    helm = {
      source = "hashicorp/helm"
      version = "3.0.2"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0" # Use a compatible version
    }
  }
}

provider "docker" {
    host = "unix:///var/run/docker.sock"
}

provider "helm" {
    kubernetes = {
        config_path = "~/.kube/config"
        config_context = "docker-desktop" 
    }
}

variable "nexus_username" {
 description = "This is a variable of nexus username"
 type        = string
}

variable "nexus_password" {
 description = "This is a variable of nexus username"
 type        = string
}

resource "helm_release" "backend" {
  name  = "backend"
  version = "1.0.0"
  repository = 	"http://192.168.1.135:8081/repository/helm/"
  chart      = "backend"                     # Name of the chart within the repository
  namespace  = "default"                      # Kubernetes namespace for the release
  # Optional: specify values to customize the chart
  # values = [
  #      file("values.yaml")
  #    ]
  repository_username   = var.nexus_username
  repository_password   = var.nexus_password
}
