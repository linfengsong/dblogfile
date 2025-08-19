{{- define "frontend.name" -}}
  {{ .Chart.Name }}
{{- end -}}

{{- define "frontend.fullname" -}}
  {{- printf "%s-%s" (include "frontend.name" .) .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}