{{- define "backend.name" -}}
  {{ .Chart.Name }}
{{- end -}}

{{- define "backend.fullname" -}}
  {{- printf "%s-%s" (include "backend.name" .) .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}