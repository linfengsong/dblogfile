
To create simple frontend and backend Helm charts, follow these steps:

### 1. Create Chart Directories

First, set up the directory structure for both the frontend and backend charts.

```
frontend/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml
    └── service.yaml

backend/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── deployment.yaml
    └── service.yaml
```

### 2. Define Chart Metadata

**Frontend Chart (`frontend/Chart.yaml`):**

```yaml
name: frontend
version: 0.1.0
description: A simple frontend application
maintainers:
  - name: Your Name
    email: your.email@example.com
```

**Backend Chart (`backend/Chart.yaml`):**

```yaml
name: backend
version: 0.1.0
description: A simple backend API server
maintainers:
  - name: Your Name
    email: your.email@example.com
```

### 3. Set Up Values Files

These files store default values that can be overridden during installation.

**Frontend Values (`frontend/values.yaml`):**

```yaml
image:
  repository: my-frontend-image
  tag: latest
replicaCount: 3
service:
  type: LoadBalancer
  port: 80
ingress:
  enabled: true
  hostname: frontend.example.com
```

**Backend Values (`backend/values.yaml`):**

```yaml
image:
  repository: my-backend-image
  tag: latest
replicaCount: 2
service:
  port: 8080
```

### 4. Create Helper Templates

These files define reusable functions for generating resource names.

**Frontend Helpers (`frontend/templates/_helpers.tpl`):**

```yaml
{{- define "frontend.name" -}}
  {{ .Chart.Name }}
{{- end -}}

{{- define "frontend.fullname" -}}
  {{- if .Chart.IsUpgrade }}
    {{- (include "frontend.name" .) | trunc 63 | trimSuffix "-" }}
  {{- else }}
    {{- printf "%s-%s" (include "frontend.name" .) .Release.Name | trunc 63 | trimSuffix "-" }}
  {{- end }}
{{- end -}}
```

**Backend Helpers (`backend/templates/_helpers.tpl`):**

```yaml
{{- define "backend.name" -}}
  {{ .Chart.Name }}
{{- end -}}

{{- define "backend.fullname" -}}
  {{- if .Chart.IsUpgrade }}
    {{- (include "backend.name" .) | trunc 63 | trimSuffix "-" }}
  {{- else }}
    {{- printf "%s-%s" (include "backend.name" .) .Release.Name | trunc 63 | trimSuffix "-" }}
  {{- end }}
{{- end -}}
```

### 5. Define Deployments

These files create Kubernetes Deployment resources.

**Frontend Deployment (`frontend/templates/deployment.yaml`):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "frontend.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "frontend.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "frontend.name" . }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 80
```

**Backend Deployment (`backend/templates/deployment.yaml`):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "backend.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "backend.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "backend.name" . }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: 8080
```

### 6. Define Services

These files create Kubernetes Service resources.

**Frontend Service (`frontend/templates/service.yaml`):**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "frontend.fullname" . }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 80
  selector:
    app: {{ include "frontend.name" . }}
```

**Backend Service (`backend/templates/service.yaml`):**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "backend.fullname" . }}
spec:
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 8080
  selector:
    app: {{ include "backend.name" . }}
```

### 7. Build and Install the Charts

Run these commands to package and install your charts.

```bash
# Build the charts
helm package frontend/
helm package backend/

# Install the charts
helm install my-frontend ./frontend-0.1.0.tgz
helm install my-backend ./backend-0.1.0.tgz
```

### 8. Verify Installation

Check that your pods are running.

```bash
kubectl get pods -l app=my-frontend
kubectl get pods -l app=my-backend
```

### Notes

- Replace `my-frontend-image` and `my-backend-image` with your actual Docker image names.
- Adjust `replicaCount`, `port`, and other values as needed in the `values.yaml` files.
- Ensure you have a Kubernetes cluster running and accessible via `kubectl`.

This setup provides a basic structure for deploying frontend and backend applications using Helm. You can enhance it by adding more features like ConfigMaps, Secrets, Horizontal Pod Autoscaling, etc., based on your needs.