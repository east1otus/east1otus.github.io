---
title: PE 파일에서 ASLR 비활성화 방법
author: east1otus
date: 2026-04-01 +0900
categories: [Reversing, Tips]
tags: [Reversing, Digital Forensics, Tips]
---
<br>

## ASLR (Address Space Layout Randomization)
ASLR은 메모리 손상 취약점을 이용한 공격을 방지하기 위한 기법이다.  
프로세스가 실행될 때 스택, 힙, 라이브러리, 주요 데이터 영역 등의 메모리 주소를 무작위로 배치해 공격자가 주소를 예측하기 어렵게 만드는 것이다.

이로 인해 ASLR이 적용된 프로그램은 동적 분석을 할 때 약간 불편할 수 있다. 디스어셈블러에서 보는 주소와 실제 메모리 상의 주소가 다르기 때문에, 정적/동적 분석을 병행할 경우 계산을 통해 주소를 맞춰서 봐야 하는 번거로움이 생긴다.  
![1](/assets/img/2026-04-01-1/1.png){: width="700" .left}  
![2](/assets/img/2026-04-01-1/2.png){: width="700" .left}  
<br style="clear: both;"><br>



## PE 헤더에서 ASLR 비활성화

PE 바이너리는 헤더 내 설정을 통해 ASLR 적용 여부가 결정된다. 따라서 헤더를 수정하여 ASLR을 비활성화할 수 있다.

ASLR은 `IMAGE_NT_HEADERS`의 `IMAGE_OPTIONAL_HEADER` 내부 `DLL Characteristcs` 필드에서 지정된다.  
![3](/assets/img/2026-04-01-1/3.png){: width="700" .left}  
<br style="clear: both;"><br>
이 필드의 `IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE`(0x0040) 플래그가 설정되면 ASLR이 활성화된다.  
![4](/assets/img/2026-04-01-1/4.png){: width="700" .left}  
<br style="clear: both;"><br>


PE 분석 도구로 파일을 열어서 해당 영역을 확인할 수 있다. 여기서는 헤더 값을 직접 수정까지 할 수 있는 CFF Explorer를 사용하였다.

![5](/assets/img/2026-04-01-1/5.png){: width="700" .left}  
<br style="clear: both;">
이렇게 `DLL Characteristics` 필드에 `IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE` 플래그(0x40)가 설정되어있는 것을 볼 수 있다.  
(이거 하다가 알게 된 건데 CFF Explorer에서 `DllCharacteristics`의 각 플래그들을 체크박스 형태로 확인하고 수정할 수 있게 해줘서 편하다!)

이 플래그를 다음과 같이 해제해주면 된다.  
![6](/assets/img/2026-04-01-1/6.png){: width="700" .left}  
<br style="clear: both;"><br>


다시 디버거로 실행해보면, 프로그램이 고정된 주소로 로드되는 것을 확인할 수 있다.  
![7](/assets/img/2026-04-01-1/7.png){: width="700" .left}  
<br style="clear: both;"><br>
