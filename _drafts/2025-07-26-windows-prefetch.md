---
title: Windows Prefetch 아티팩트 조사
author: east1otus
date: 2025-07-26 +0900
categories: [Digital Forensics, BoB]
tags: [Digital Forensics, Windows, BoB]
---
<br>

## 개요

조사 환경: Windows 11 64bit

#### Prefetch란
- Windows XP 이후 운영체제에서 도입
- 부팅 또는 응용프로그램 실행 시 성능 향상을 위한 캐싱 메커니즘
- 부팅 prefetch / 애플리케이션 prefetch
  - 일반적으로 부팅 시 약 120초, 애플리케이션 실행 시 약 10초 동안 모니터링하여 prefetch 파일 생성
- Prefetch 확인 도구
  - WinPrefetchView, PECmd 등

#### Prefetch 파일 저장 위치 및 형식

- 저장 위치: `%SystemRoot%\Prefetch`

- 파일 형식
  - Boot Prefetch: `NTOSBOOT-B00DFAAD.pf`
  - Application Prefetch: `{실행파일명}-{경로 기반 해시}.pf`

- ReadyBoot 디렉터리 (`%SystemRoot%\Prefetch\ReadyBoot`)
  - 부팅 시 디스크 I/O 트레이스 및 캐시 데이터 저장
  - `Trace#.fx`
    - 부팅 과정에서 접근된 파일 및 데이터 정보 기록
    - 최근 기준 최대 5개까지 유지
  - `rblayout.xin`
    - ReadyBoot 동작에 필요한 레이아웃 및 캐시 정보 관리

#### Prefetch 관련 레지스트리
- `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters`
  - `EnablePrefetcher` 값
    - 0: Prefetch 비활성화
    - 1: 애플리케이션 Prefetch만 활성화
    - 2: 부팅 Prefetch만 활성화
    - 3: 전체 활성화


## Prefetch 구조

#### Windows 버전에 따른 압축 여부

- Windows XP / Vista / 7: 비압축
- Windows 8 / 8.1: 비압축
- Windows 10: 압축
- Windows 11: 압축

Windows 10부터 전용 알고리즘(Xpress Huffman)으로 압축된다. Prefetch 전용 도구(WinPrefetchView, PECmd 등)가 자동으로 압축을 해제해서 파싱해 준다.

#### Prefetch 파일 헤더
- 포함 정보
  - Prefetch 버전
  - 시그니처(SCCA)
  - Prefetch 파일 크기
  - 실행 파일 이름
  - 파일경로 기반 해시
- Version 값
  - 31(0x1F): Windows 11
  - 30(0x1e): Windows 10
  - 26(0x1a): Windows 8.1
  - 23(0x17): Windows Vista / Windows 7
  - 17(0x11): Windows XP / Windows 2003

#### File Metrics Array
- 실행 파일이 접근한 파일들에 대한 메타데이터를 저장하는 배열

#### Trace Chains Array
- 프로그램 실행 과정에서 발생한 디스크 I/O 흐름(순서) 정보를 저장하는 배열

#### File Name Strings
- 실행 과정에서 접근한 파일들의 전체 경로 문자열 목록

#### Volumes Information
- 실행 파일이 참조한 디스크 볼륨 정보 저장


## Prefetch로 획득 가능한 아티팩트 정리
- 실행 파일 이름
- 실행 시각
- 실행 횟수
- 마지막 실행 시각
- 실행 파일이 참조한 DLL 및 모듈
- Prefetch 파일의 생성 및 수정 시간
- 프로그램 실행 시 접근한 파일 경로