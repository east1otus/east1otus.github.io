---
title: Linux procfs (/proc)
author: east1otus
date: 2025-07-23 +0900
categories: [Digital Forensics, BoB]
tags: [Digital Forensics, Linux, BoB]
---
<br>

## Linux /proc 파일시스템 (procfs)
- 리눅스 커널이 제공하는 가상 파일시스템
- 실행 중인 프로세스와 시스템 상태 정보를 파일 형태로 확인할 수 있다.
- procfs는 루트 디렉터리 하위의 /proc에 마운트된다.

<br>

#### /proc 디렉터리 기능
- 사용자와 응용프로그램이 커널 내부 상태(프로세스, 메모리, 하드웨어 등)를 확인할 수 있다.
  - 대표적으로 top, ps, lsof 등이 /proc을 참조
- 시스템 정보를 제공한다.
  - CPU, 메모리, 부팅 시간, 커널 버전
  - 각 프로세스를 실행한 명령어, 환경 변수, 열린 파일 정보 등

<br>

#### /proc 디렉터리 속성
- 시스템 부팅 시 생성되고 종료 시 사라지는 휘발성 데이터이다.
- 실행 중인 프로세스마다 하위 디렉터리가 동적으로 생성되고 제거된다.
- 파일처럼 접근할 수 있지만, 디스크에 저장되지 않는 가상 파일시스템이다.

<br>

## /proc 디렉터리 구성 요소 조사
> 조사 환경: kali linux 2025.2
  ![1](/assets/img/2025-07-23-1/1.png){: width="600" .left}
  <div style="clear: both;"></div>

각 파일들에 대해서? 조사

### /proc 하위 파일

#### buddyinfo 파일

![2](/assets/img/2025-07-23-1/2.png){: width="600" .left}
<div style="clear: both;"></div>

- 메모리 단편화(fragmentation) 상태를 진단하는 데 사용된다
- 버디 메모리 할당 알고리즘을 사용하며,  
특정 크기의 페이지 중 언제든지 사용 가능한 페이지 수를 나타낸다.

#### cgroups

![3](/assets/img/2025-07-23-1/3.png){: width="600" .left}
<div style="clear: both;"></div>

- cgroup 서브시스템 이름, hierarchy ID, cgroup 수, task 수 등의 정보를 제공

#### cmdline

![4](/assets/img/2025-07-23-1/4.png){: width="600" .left}
<div style="clear: both;"></div>

- 커널에 전달된 매개변수를 보여준다.
- ro: 커널이 읽기 전용으로 마운트됨
- quiet: 부팅 시 모든 상세 커널 메시지가 억제됨

#### consoles

![2](/assets/img/2025-07-23-1/2.png){: width="600" .left}
<div style="clear: both;"></div>

- 시스템에서 현재 등록된 콘솔 장치에 대한 정보
  - 장치 이름, 콘솔의 I/O 포트, 콘솔에서 사용되는 드라이버 등
- 시스템이 어떤 콘솔에서 부팅되었는지 확인할 수 있음

#### cpuinfo

![2](/assets/img/2025-07-23-1/2.png){: width="600" .left}
<div style="clear: both;"></div>

- 시스템의 CPU 정보 제공
- processor: 각 프로세서의 식별 번호
- cpu family: 시스템에 있는 프로세서의 유형
- model name: 프로세서의 모델명
- cpu MHz: 프로세서의 속도
- cache size: 프로세서에 사용 가능한 L2 캐시의 양
- siblings: 동일한 물리적 CPU에 있는 형제 CPU 수
- flags: 프로세서에 대한 여러 특징들 정의

#### crypto

![2](/assets/img/2025-07-23-1/2.png){: width="600" .left}
<div style="clear: both;"></div>

- 리눅스 커널에 등록된 암호화 알고리즘, 드라이버, 모듈 등의 정보 제공

#### devices
- 등록된 문자 장치와 블록 장치 목록
- 각 장치의 주 번호(major number), 이름 포함

#### diskstats
- 시스템의 블록 디바이스 I/O 통계 정보

#### dma
- 사용 중인 ISA DMA 채널 목록

#### execdomains
- 리눅스 커널에서 지원하는 실행 도메인과 각 도메인의 personality 정보

#### fb
- 프레임 버퍼 장치 번호와 해당 장치를 제어하는 드라이버 정보

#### filesystems
- 커널에서 현재 지원하는 파일시스템 유형 목록
- 1번째 열: 블록 장치 기반 파일시스템인지 여부
  - nodev: 장치 파일을 사용하지 않는 파일시스템
- 2번째 열: 파일시스템 이름

#### interrupts
- 각 IRQ가 CPU별로 처리된 횟수를 제공한다.
- 각 열 항목: IRQ | CPU0, CPU1, ... | Controller | Flags | Name
  - IRQ: IRQ 번호
  - CPU: 각 CPU가 해당 IRQ를 처리한 횟수
  - Controller: 인터럽트 컨트롤러
  - Flags: 인터럽트 설정 정보
  - Name: 해당 IRQ에 연결된 장치 또는 드라이버 이름

#### iomem
- 시스템 물리 메모리 주소 공간의 매핑 정보
- 1번째 열: 메모리 주소 범위
- 2번째 열: 해당 주소 영역의 용도 또는 할당된 장치/기능
  - RAM 영역, 커널이 사용하는 메모리, 장치에 할당된 메모리 주소 영역(MMIO) 등을 표시한다

#### ioports
- 장치와의 입출력 통신에 사용되는 등록된 I/O 포트 주소 범위 목록

#### kallsyms
- 커널의 심볼 테이블 정보
- 커널 내 함수 및 변수 이름에 대한 필수 정보 포함
  - 메모리 내의 심볼 주소
  - 심볼의 유형
  - 심볼의 이름

#### kcore (root 권한 필요)
- 시스템 물리 메모리의 ELF 형식 이미지에 접근할 수 있는 파일

#### keys
- 커널의 키 관리 기능에 대한 인터페이스 제공

#### key-users
- UID별 키 사용 통계 정보
- UID, 보유한 키 수, 할당된 키 수, 생성된 키 수, 갱신/무효화된 키 수 등을 포함

#### kmsg (root 권한 필요)
- 커널 로그 버퍼에 접근하기 위한 인터페이스
- 메시지들은 이후 /sbin/klogd나 bin/dmesg 등 다른 프로그램이 읽어감

#### kpagecgroup (root 권한 필요)
- 각 물리 메모리 페이지가 어떤 cgroup에 속하는지 확인 가능

#### kpagecount (root 권한 필요)
(사진고쳐야함)
- 각 물리 메모리 페이지의 참조 횟수 정보를 제공
- 각 항목은 하나의 물리 메모리 페이지를 나타냄
- 값은 해당 페이지의 참조 횟수(reference count)를 의미

#### loadavg
- 시간에 따른 CPU 및 I/O 부하 평균
- uptime 등에서 사용됨
- 1-3열: 지난 1, 5, 15분 동안의 부하 평균값
- 4열: 실행 가능한 프로세스 수 / 총 프로세스 수
- 5열: 사용된 마지막 프로세스 PID

#### locks
- 커널에 의해 잠겨 있는 파일 표시
- FLOCK: flock 시스템 호출 기반의 파일 잠금  
↔  
POSIX: fcntl/lockf 기반의 POSIX 파일 잠금
- ADVISORY: 협의적 잠금 -  다른 프로세스가 이를 무시할 수 있음  
↔  
MANDATORY: 강제적 잠금 - 잠금 동안 다른 접근이 제한됨

#### meminfo
- RAM 사용량에 대한 유용한 정보들
- free, top 등이 참조
- MemTotal / MemFree: 총 / 시스템에서 사용되지 않은 물리적 RAM 양
- Buffers: 파일 버퍼에 사용된 물리적 RAM 양
- Cached: 캐시 메모리로 사용된 물리적 RAM 양
- SwapCached: 스왑에 있었다가 메모리에 캐시된 페이지
- Active / Inactive: 최근 사용된 / 사용되지 않은 메모리 페이지
- SwapTotal / SwapFree: 총 / 남은 스왑 공간
- Dirty: 디스크에 기록되기를 기다리는 메모리
- Writeback: 디스크에 기록 중인 메모리
- Mapped: 메모리에 매핑된 파일 및 라이브러리 영역
- Slab: 커널 데이터 구조 캐시에 사용되는 메모리
- Committed_AS: 현재까지 커밋된 메모리 총량
- VMallocTotal: vmalloc 영역의 전체 크기
- VMallocChunk: 사용 가능한 가장 큰 연속 vmalloc 영역
- HugePages_Total / HugePages_Free: 총 / 사용 가능한 huge page 수
- Hugepagesize: 각 huge page의 크기

#### misc
- misc(major 10)에 등록된 문자 장치 드라이버 목록

#### modules
- 커널에 로드된 모듈 목록
- 1열: 모듈 이름
- 2열: 모듈의 메모리 크기
- 3열: 모듈의 참조 횟수(reference count)
- 4열: 의존하는 모듈 목록
- 5열: 모듈 상태 (Live, Loading, Unloading)
- 6열: 모듈이 로드된 메모리 주소

#### mtrr (root 권한 필요)
- 현재 설정된 MTRR(Memory Type Range Registers) 정보

#### pagetypeinfo (root 권한 필요)
- 페이지 유형별 메모리 사용 상태 정보
- 각 페이지의 migration type(이동 가능 여부), 페이지 분포 등

#### partitions
- 디스크 파티션 정보
- major: 해당 파티션이 속한 장치의 주 번호
- minor: 해당 파티션이 속한 장치의 부 번호
- #blocks: 파티션의 블록 수
- name: 파티션 이름

#### schedstat
- CPU 스케줄링 통계 정보
- 시스템 성능 분석이나 스케줄러 동작 방식 파악 등에 이용 가능

#### slabinfo (root 권한 필요)
- 슬랩 캐시별 메모리 사용 정보
- name: 슬랩 캐시 이름
- active_objs: 현재 사용 중인 객체 수
- num_objs: 전체 객체 수
- objsize: 객체 크기
- objperslab: 슬랩당 객체 수
- pagesperslab: 슬랩당 페이지 수

- tunables
  - limit: 캐시당 최대 객체 수 제한
  - batchcount: 한 번에 할당/해제하는 객체 수
  - sharedfactor: CPU 간 캐시 공유 관련 값

- slabdata
  - active_slabs: 사용 중인 슬랩 수
  - num_slabs: 전체 슬랩 수
  - sharedavail: 공유 가능한 객체 수

#### softirqs
- softirq(소프트웨어 기반 인터럽트 처리 메커니즘)의 카운터 정보
- 각 행: softirq 유형
- 각 열: 각 CPU에서 해당 softirq가 처리된 횟수

#### stat
- 시스템 부팅 이후의 CPU, 프로세스, 인터럽트 등의 통계 정보

#### swaps
- 활성화된 스왑 영역 정보
- priority 값이 높을수록 우선적으로 사용

#### sysrq-trigger (root 권한 필요)
- echo를 통해 명령 전달 가능
  - /proc/sys/kernel/sysrq 값이 0이 아닐 때 동작
- read 지원되지 않음
- write 시 SysRq 기능을 통해 시스템 제어 명령을 실행 가능

#### timer-list (root 권한 필요)
- 현재 커널에서 활성화된 타이머와 타이머 서브시스템 상태 정보

#### uptime
- 시스템이 마지막으로 재시작된 이후 얼마나 오래 켜져 있었는지에 대한 정보
- 첫번째 값: 시스템이 가동된 총 시간
- 두번째 값: 전체 CPU가 유휴 상태였던 시간의 누적값

#### version
- 사용 중인 Linux 커널 버전, 빌드 정보(gcc 버전) 등

#### vmallocinfo (root 권한 필요)
- 커널이 vmalloc을 통해 할당한 가상 메모리 영역에 대한 정보

#### vmstat
- 커널 메모리 및 가상 메모리 서브시스템의 통계 정보
- 메모리 관리, 페이지 교체, I/O 요청 등의 상태를 확인 가능
- 주요 필드
  - nr_free_pages: 현재 사용 가능한 페이지 수
  - nr_active_anon, nr_active_file: 활성화된 익명/파일 캐시 페이지 수
  - pgfault: 페이지 폴트 수
  - pgpgin, pgpgout: 디스크와 메모리 간 데이터 입출력량(kB 단위)
  - pgalloc_*, pgfree: 페이지 할당 및 해제 수

  #### zoneinfo
  - 메모리 zone별 상태 및 통계 정보

  ### /porc 하위 디렉터리
  #### 프로세스 디렉터리