
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

resource "helm_release" "frontend" {
  name  = "frontend"
  chart = "../helm/frontend"
  values = [templatefile("../helm/frontend/values.yaml", {})]
  dependency_update = true
  repository            = "http://192.168.1.135:8081/"
  repository_username   = var.nexus_username
  repository_password   = var.nexus_password
}