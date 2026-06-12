$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$cp = (Get-Content "$root\classpath-dev.txt" -Raw)

& "C:\Program Files\Java\jdk-21\bin\java.exe" -cp $cp com.eduai.lms.EduAiLmsApplication --spring.profiles.active=dev
