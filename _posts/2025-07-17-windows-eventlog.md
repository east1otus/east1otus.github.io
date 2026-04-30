---
title: Windows 이벤트 로그 조사
author: east1otus
date: 2025-07-17 +0900
categories: [Digital Forensics, BoB]
tags: [Digital Forensics, Windows, BoB]
---

## 개요
이벤트 로그(Event Log)는 Windows 운영체제에서 발생하는 시스템, 보안, 애플리케이션 관련 활동을 기록하는 로그 데이터이다. 운영체제 내부 동작뿐 아니라 사용자 행위, 서비스 실행, 오류 발생 등 다양한 이벤트가 시간 순서대로 저장된다.

포렌식 관점에서 이벤트 로그는 시스템에서 발생한 행위를 시간 기반으로 재구성할 수 있는 핵심 증거 자료이다. 특히 서비스 생성, 실행, 계정 로그인, 권한 변경과 같은 이벤트는 공격자의 행위를 추적하거나 침해 여부를 판단하는 데 중요한 근거가 된다.

Windows 이벤트 로그는 주요하게 다음과 같은 로그 채널로 구성된다.

System: 시스템 구성 요소 및 서비스 관련 이벤트
Security: 로그인, 권한 사용 등 보안 관련 이벤트
Application: 사용자 애플리케이션에서 발생한 이벤트

이 중 서비스 관련 행위는 주로 System 로그에 기록된다.

## 서비스 실행/종료
- 위치: System 로그 (Service Control Manager)
  - 7036: 서비스 상태가 변경됨 (실제 시작, 중지 등)
  - 7035: 서비스로 제어 코드가 전달됨 (시작, 중지 명령 등)
  - 7040: 서비스 시작 유형 변경됨
  - 7045: 서비스 설치됨

## 계정 생성/삭제
- 위치: Security 로그
  - 4720: 사용자 계정 생성 (Audit User Account Management 활성화 필요)
  - 4726: 사용자 계정 삭제 (Audit User Account Management 활성화 필요)
  - 4738: 사용자 속성 변경 (Audit User Account Management 활성화 필요)

## 프로그램 설치/삭제
- 위치: Application 로그 (MsiInstaller)
  - 1033: Windows Installer로 제품 설치
  - 11707: 설치 성공
  - 11708: 설치 실패
  - 11724: 제거 성공
  - 11725: 제거 실패

## 프로세스
- 위치: Security 로그
  - 4688: 프로세스 생성 (Audit Process Creation 활성화 필요)
    - 명령줄 기록 활성화 시 실행 인자 확인 가능
  - 4689: 프로세스 종료 (Audit Process Termination 활성화 필요)

## 로그인/로그아웃
- 위치: Security 로그
  - 4624: 계정 로그온 (Audit Logon 활성화 필요)
  - 4625: 로그온 실패 (Audit Logon 활성화 필요)
  - 4634: 계정 로그오프 (Audit Logoff 활성화 필요)
  - 4647: 명시적 로그아웃 (Audit Logoff 활성화 필요)
  - 4672: 특수 권한 로그인 (Audit Logon 활성화 필요)

## 원격 접속
- 위치: Security 로그
  - 4624(Logon Type 10): 원격 인터랙티브 로그온(RDP 등) (Audit Logon 활성화 필요)
  - 4778: RDP 세션 재연결 (Audit Other Logon/Logoff Events 활성화 필요)
  - 4779: RDP 세션 연결 끊어짐 (Audit Other Logon/Logoff Events 활성화 필요)

## 계정 권한 상승
- 위치: Security 로그
  - 4670: 객체 권한 변경 (Audit Object Access 활성화 필요)
  - 4672: 특수 권한 로그인 - 관리자 권한으로 로그인 여부 확인 (Audit Logon 활성화 필요)
  - 4732: 보안이 활성화된 로컬 그룹에 멤버 추가 (Audit Security Group Management 활성화 필요)
  - 4733: 보안 그룹에서 제거 (Audit Security Group Management 활성화 필요)

## 패스워드 생성/변경/삭제
- 위치: Security 로그
  - 4720: 새로운 사용자 계정 생성 (패스워드 생성도 포함됨) (Audit User Account Management 활성화 필요)
  - 4723: 계정 비밀번호 변경 시도 (Audit User Account Management 활성화 필요)
  - 4724: 계정 비밀번호 재설정 시도 (Audit User Account Management 활성화 필요)
  - 4726: 계정 제거 (패스워드도 삭제됨) (Audit User Account Management 활성화 필요)
  - 4742: 컴퓨터 계정 속성 변경 (Audit User Account Management 활성화 필요)

## 파워쉘 스크립트 실행
- 위치: Security 로그
  - 4688: powershell.exe 실행 여부 확인 (Audit Process Creation 활성화 필요)
- 위치: Microsoft-Windows-PowerShell/Operational 로그
  - 400: PowerShell 엔진 시작
  - 403: PowerShell 엔진 종료
  - 600: PowerShell Provider 시작
  - 800: 명령 실행
  - 4104: 스크립트 블록 로깅 - PowerShell에서 실행된 코드 전체 내용 캡처 (Script Block Logging 활성화 필요)

## xp_cmdshell 활성화/사용
- xp_cmdshell이란
  : MSSQL에서 Windows Command를 수행할 수 있는 프로시저
  - SQL Server 설치되어 있어야 함
  - 기본적으로 사용하지 않도록 설정되어 있음
- 관련 이벤트 로그
  - cmd.exe나 powershell.exe 등이 xp_cmdshell로 인해 실행될 수 있음 (OS 명령 실행)
  - Security 로그의 4688(프로세스 실행)을 통해 추적 가능