---
title: Windows VM 비밀번호 분실 시 재설정
author: east1otus
date: 2025-08-20 +0900
categories: [Digital Forensics, Tips]
tags: [Tips]
---

> Windows10 / VMware 기준
{: .prompt-info }
<br>

1. 윈도우 설치 ISO 다운로드  
  [Windows 10 다운로드](https://www.microsoft.com/ko-kr/software-download/windows10)
  <br><br>
2. 비밀번호를 찾고자 하는 VM에서 Settings → Hardware → CD/DVD  
  ![test](/assets/img/2025-08-20-2/1.png){: width="500"}
  - Connected at power on 체크  
  - Use ISO image file 선택 → 윈도우 설치 ISO 연결  
  <br>
3. 부팅하여 BIOS 진입 (켜자마자 F2 연타)<br>→ EFI VMware Virtual SATA CDROM Drive 선택 (지금 VM에 연결된 ISO로 부팅한다는 의미)  
  ![test](/assets/img/2025-08-20-2/2.png){: width="500"}
  <br><br>
4. 부팅하고 Windows 설치화면이 뜨면  
  ![test](/assets/img/2025-08-20-2/3.png){: width="500"}  
  Shift+F10을 눌러 CMD 실행  
  ![test](/assets/img/2025-08-20-2/4.png){: width="500"}
  <br><br>
5. 다음 명령어를 순서대로 입력  
  ```bat
  move C:\Windows\System32\Utilman.exe C:\Windows\System32\Utilman.exe.bak
  copy C:\Windows\System32\cmd.exe C:\Windows\System32\Utilman.exe
  ```
  - Utilman.exe: 접근성 프로그램
  - 기존 Utilman.exe의 이름을 변경해 두고, cmd.exe를 Utilman.exe 이름으로 복사 
  ![test](/assets/img/2025-08-20-2/5.png){: width="500"} 
  <br><br>
6. VM을 재부팅하여 로그인 화면에서 접근성 아이콘을 클릭하면 cmd.exe가 실행된다.  
  ![test](/assets/img/2025-08-20-2/6.png){: width="500"}
  ![test](/assets/img/2025-08-20-2/7.png){: width="500"}
  - 로그인 화면에서 접근성 아이콘을 클릭하면 Utilman.exe가 실행되는데, 앞에서 이를 cmd.exe 파일로 바꿔치기한 것이다.
  - 로그인 이전 단계에서 접근성 프로그램은 winlogon 프로세스에 의해 SYSTEM 권한으로 실행되므로, 이 cmd에서도 SYSTEM 권한의 명령 수행이 가능해진다.
  <br><br>
7. 비밀번호 재설정
  ```bat
  net user <사용자이름> <새 비밀번호>
  ```
  - SYSTEM 권한으로 실행되었으므로 로컬 계정의 비밀번호를 직접 변경이 가능
  ![test](/assets/img/2025-08-20-2/8.png){: width="500"}
  - 이제 바꾼 비밀번호로 로그인하면 된다.
  <br><br>
8. 접근성 기능 원래대로 돌려놓기
  ```bat
  move C:\Windows\System32\Utilman.exe.bak
  C:\Windows\System32\Utilman.exe
  ```