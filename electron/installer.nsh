!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
  ; Custom pre-initialization code
  SetRegView 64
!macroend

!macro customInit
  ; Show splash while installing
  SetOutPath $PLUGINSDIR
!macroend

!macro customInstall
  ; Create program files structure
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\data"
  
  ; Write additional registry entries
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "URLInfoAbout" "https://ktm.lovable.app"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "HelpLink" "https://ktm.lovable.app/contact"
  
  ; Add to PATH (optional)
  ; EnVar::AddValue "PATH" "$INSTDIR"
!macroend

!macro customInstallMode
  ; Force per-machine installation
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customUnInit
  ; Custom uninstall initialization
!macroend

!macro customUnInstall
  ; Clean up additional files
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\data"
  
  ; Remove from PATH if added
  ; EnVar::DeleteValue "PATH" "$INSTDIR"
!macroend

!macro customRemoveFiles
  ; Additional cleanup
  Delete "$INSTDIR\*.log"
!macroend

; Custom welcome page text
!define MUI_WELCOMEPAGE_TITLE "مرحباً بك في KTM Launcher"
!define MUI_WELCOMEPAGE_TEXT "سيقوم هذا البرنامج بتثبيت KTM Launcher على جهازك.$\r$\n$\r$\nمنصة الألعاب الأولى - حمل وشغل ألعابك المفضلة بسهولة.$\r$\n$\r$\nاضغط التالي للمتابعة."

; Custom finish page
!define MUI_FINISHPAGE_TITLE "اكتمل التثبيت!"
!define MUI_FINISHPAGE_TEXT "تم تثبيت KTM Launcher بنجاح.$\r$\n$\r$\nاضغط إنهاء لإغلاق المثبّت."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "تشغيل KTM Launcher الآن"
!define MUI_FINISHPAGE_LINK "زيارة موقع KTM"
!define MUI_FINISHPAGE_LINK_LOCATION "https://ktm.lovable.app"