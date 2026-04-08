{{/*
Expand the name of the chart.
*/}}
{{- define "channellq.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "channellq.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "channellq.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "channellq.labels" -}}
helm.sh/chart: {{ include "channellq.chart" . }}
{{ include "channellq.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "channellq.selectorLabels" -}}
app.kubernetes.io/name: {{ include "channellq.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "channellq.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "channellq.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate common environment variables for all services
*/}}
{{- define "channellq.commonEnv" -}}
- name: NODE_ENV
  value: {{ .Values.global.nodeEnv | quote }}
- name: NODE_TLS_REJECT_UNAUTHORIZED
  value: "0"
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: JWT_SECRET
- name: KAFKA_BROKER
  value: {{ .Values.kafka.broker | quote }}
- name: KAFKA_USE_SSL
  value: {{ .Values.kafka.useSSL | quote }}
- name: KAFKA_SSL_CA_PATH
  value: {{ .Values.kafka.sslCaPath | quote }}
- name: KAFKA_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: KAFKA_USERNAME
- name: KAFKA_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: KAFKA_PASSWORD
- name: KAFKA_REPLICATION_FACTOR
  value: {{ .Values.kafka.replicationFactor | quote }}
- name: KAFKA_USER_EVENTS_PARTITIONS
  value: {{ .Values.kafka.partitions.userEvents | quote }}
- name: KAFKA_CHAT_EVENTS_PARTITIONS
  value: {{ .Values.kafka.partitions.chatEvents | quote }}
- name: KAFKA_MEDIA_EVENTS_PARTITIONS
  value: {{ .Values.kafka.partitions.mediaEvents | quote }}
- name: REDIS_HOST
  value: {{ .Values.redis.host | quote }}
- name: REDIS_PORT
  value: {{ .Values.redis.port | quote }}
- name: REDIS_USERNAME
  value: {{ .Values.redis.username | quote }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: REDIS_PASSWORD
- name: REDIS_USE_TLS
  value: {{ .Values.redis.useTLS | quote }}
- name: EMAIL_HOST
  value: {{ .Values.email.host | quote }}
- name: EMAIL_PORT
  value: {{ .Values.email.port | quote }}
- name: EMAIL_USER
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: EMAIL_USER
- name: EMAIL_PASS
  valueFrom:
    secretKeyRef:
      name: {{ include "channellq.fullname" . }}-secrets
      key: EMAIL_PASS
- name: LOG_LEVEL
  value: {{ .Values.logging.level | quote }}
- name: LOKI_HOST
  value: {{ .Values.logging.lokiHost | quote }}
{{- end }}

{{/*
Generate namespace
*/}}
{{- define "channellq.namespace" -}}
{{- .Values.global.namespace | default .Release.Namespace }}
{{- end }}

{{/*
Generate image name with registry
*/}}
{{- define "channellq.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $image := .image -}}
{{- $tag := .tag | default .Chart.AppVersion -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry $image $tag -}}
{{- else -}}
{{- printf "%s:%s" $image $tag -}}
{{- end -}}
{{- end }}