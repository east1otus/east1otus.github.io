---
title: Chrome History 아티팩트 조사
author: east1otus
date: 2025-07-20 +0900
categories: [Digital Forensics, BoB]
tags: [Digital Forensics, BoB]
---

## 개요
Chrome History 파일은 사용자의 웹 활동 정보(방문 URL, 접속 시간, 검색 기록 등)를 저장하는 로컬 데이터베이스이다.
- 위치: `%LocalAppData%\Google\Chrome\User Data\[프로필 폴더]\History`
- SQLite 데이터베이스
- 분석 도구: DB Browser for SQLite 등  
<br>

## History 파일 내 테이블

| No. | 테이블 이름 | 설명 |
|-----|-------------|------|
| 1 | cluster_keywords | 특정 클러스터에 연관된 키워드 저장 |
| 2 | cluster_visit_duplicates | 클러스터 내에서 중복된 방문 기록 관리 |
| 3 | clusters | 방문 기록을 그룹화한 클러스터들을 저장 |
| 4 | clusters_and_visits | 클러스터와 방문 기록 간의 연관 정보 |
| 5 | content_annotations | 방문한 페이지 콘텐츠에 대한 주석 또는 추가 정보 저장 |
| 6 | context_annotations | 방문한 페이지의 맥락에 대한 주석 또는 추가 정보 저장 |
| 7 | downloads | 사용자의 다운로드 기록 저장 |
| 8 | downloads_slices | 큰 파일을 여러 조각으로 나누어 다운로드 시, 각 조각에 대한 정보 |
| 9 | downloads_url_chains | 다운로드된 파일의 리다이렉트 URL 체인 |
| 10 | history_sync_metadata | 히스토리 동기화와 관련된 메타데이터 저장 |
| 11 | keyword_search_terms | 검색어와 해당 검색 결과 URL의 연결 정보 |
| 12 | meta | 데이터베이스 자체의 메타 정보 |
| 13 | segment_usage | 특정 세그먼트의 사용 정보 기록 |
| 14 | segments | 방문 URL을 기반으로 생성된 세그먼트 정보 저장 |
| 15 | sqlite_sequence | SQLite DB에서 AUTOINCREMENT가 설정된 테이블의 시퀀스 값 관리 |
| 16 | urls | 방문한 URL의 상세 정보 |
| 17 | visit_source | 방문 기록의 출처 |
| 18 | visits_links | 방문된 링크와 프레임 URL 관련 정보 |
| 19 | visits | 특정 URL에 대한 방문 기록의 상세 정보 |

<br>

### 1. cluster_keywords
특정 클러스터에 연관된 키워드 저장  

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | cluster_id | INTEGER | | ∨ | | 키워드가 연결된 클러스터 ID |
| 2 | keyword | VARCHAR | | ∨ | | 클러스터를 설명하는 키워드 |
| 3 | type | INTEGER | | ∨ | | 키워드 타입 식별자 |
| 4 | score | NUMERIC | | ∨ | | 키워드 관련성 또는 중요도 점수 |
| 5 | collections | VARCHAR | | ∨ | | 키워드가 속한 그룹 또는 카테고리 |

<br>

### 2. cluster_visit_duplicates
클러스터 내에서 중복된 방문 기록 관리

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | visit_id | INTEGER | ∨ | ∨ | | 중복 클러스터의 기준이 되는 visit ID |
| 2 | duplicate_visit_id | INTEGER | ∨ | ∨ | | visit_id와 동일하다고 판단된 visit ID |

<br>

### 3. clusters
방문 기록을 그룹화한 클러스터들을 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | cluster_id | INTEGER | ∨ | | | 클러스터 ID (AUTOINCREMENT) |
| 2 | should_show_on_prominent_ui_surfaces | BOOLEAN | | ∨ | | UI에 클러스터 노출 여부 |
| 3 | label | VARCHAR | | ∨ | | 클러스터의 사용자 친화 label |
| 4 | raw_label | VARCHAR | | ∨ | | 클러스터의 원시 label |
| 5 | triggerability_calculated | BOOLEAN | | ∨ | | 트리거 가능성 계산 여부 |
| 6 | originator_cache_guid | TEXT | | ∨ | | 클러스터 생성자의 GUID |
| 7 | originator_cluster_id | INTEGER | | ∨ | | 생성자 클러스터 ID |

<br>

### 4. clusters_and_visits
클러스터와 방문 기록 간의 연관 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | cluster_id | INTEGER | ∨ | ∨ | | 클러스터 ID |
| 2 | visit_id | INTEGER | ∨ | ∨ | | 방문 기록 ID |
| 3 | score | NUMERIC | | ∨ | 0 | 점수 |
| 4 | engagement_score | NUMERIC | | ∨ | 0 | 사용자 참여도 점수 |
| 5 | url_for_deduping | LONGVARCHAR | | ∨ | | 중복 제거용 URL |
| 6 | normalized_url | LONGVARCHAR | | ∨ | | 정규화된 URL |
| 7 | url_for_display | LONGVARCHAR | | ∨ | | UI 표시용 URL |
| 8 | interaction_state | INTEGER | | ∨ | 0 | 사용자와의 상호작용 상태 |

<br>

### 5. content_annotations
방문한 페이지 콘텐츠에 대한 주석 또는 추가 정보 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | visit_id | INTEGER | ∨ | | | 방문 기록 ID |
| 2 | visibility_score | NUMERIC | | | | 페이지 노출 점수 |
| 3 | floc_protected_score | NUMERIC | | | | FLoC 보호 점수 |
| 4 | categories | VARCHAR | | | | 페이지 카테고리 |
| 5 | page_topics_model_version | INTEGER | | | | 페이지 주제 모델 버전 |
| 6 | annotation_flags | INTEGER | | ∨ | | 주석 관련 플래그 비트 |
| 7 | entities | VARCHAR | | | | 식별된 엔터티 목록 |
| 8 | related_searches | VARCHAR | | | | 연관 검색어 |
| 9 | search_normalized_url | VARCHAR | | | | 정규화된 검색 요청 URL |
| 10 | search_terms | LONGVARCHAR | | | | 사용자가 입력한 검색어 |
| 11 | alternative_title | VARCHAR | | | | 대체 페이지 제목 |
| 12 | page_language | VARCHAR | | | | 페이지 언어 |
| 13 | password_state | INTEGER | | | 0 | 비밀번호 입력 상태 |
| 14 | has_url_keyed_image | BOOLEAN | | ∨ | | 이미지 기반 URL 키가 있는지 여부 |

<br>

### 6. context_annotations
방문한 페이지의 맥락에 대한 주석 또는 추가 정보 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | visit_id | INTEGER | ∨ | | | 방문 기록 ID |
| 2 | context_annotation_flags | INTEGER | | ∨ | | 플래그 비트 값 |
| 3 | duration_since_last_visit | INTEGER | | | | 이전 방문 이후 경과시간 |
| 4 | page_end_reason | INTEGER | | | | 페이지 종료 이유 |
| 5 | total_foreground_duration | INTEGER | | | | 포그라운드에 머문 총 시간 |
| 6 | browser_type | INTEGER | | ∨ | 0 | 브라우저 종류 |
| 7 | window_id | INTEGER | | ∨ | -1 | 윈도우 ID |
| 8 | tab_id | INTEGER | | ∨ | -1 | 탭 ID |
| 9 | task_id | INTEGER | | ∨ | -1 | 태스크 ID |
| 10 | root_task_id | INTEGER | | ∨ | -1 | 루트 태스크 ID |
| 11 | parent_task_id | INTEGER | | ∨ | -1 | 부모 태스크 ID |
| 12 | response_code | INTEGER | | ∨ | 0 | HTTP 응답 코드 |

<br>

### 7. downloads
사용자의 다운로드 기록 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | | | 다운로드 ID |
| 2 | guid | VARCHAR | | ∨ | | 다운로드 GUID |
| 3 | current_path | LONGVARCHAR | | ∨ | | 현재 파일 경로 |
| 4 | target_path | LONGVARCHAR | | ∨ | | 목표 경로 |
| 5 | start_time | INTEGER | | ∨ | | 다운로드 시작 시간 |
| 6 | received_bytes | INTEGER | | ∨ | | 수신된 바이트 수 |
| 7 | total_bytes | INTEGER | | ∨ | | 총 바이트 수 |
| 8 | state | INTEGER | | ∨ | | 다운로드 상태 |
| 9 | danger_type | INTEGER | | ∨ | | 위험 판단 유형 |
| 10 | interrupt_reason | INTEGER | | ∨ | | 중단 사유 |
| 11 | hash | BLOB | | ∨ | | 파일 해시 |
| 12 | end_time | INTEGER | | ∨ | | 다운로드 완료 시간 |
| 13 | opened | INTEGER | | ∨ | | 열림 여부 |
| 14 | last_access_time | INTEGER | | ∨ | | 마지막 접근 시간 |
| 15 | transient | INTEGER | | ∨ | | 일시적 다운로드 여부 |
| 16 | referrer | VARCHAR | | ∨ | | 참조 URL |
| 17 | site_url | VARCHAR | | ∨ | | 다운로드 사이트 |
| 18 | embedder_download_data | VARCHAR | | ∨ | | embedder 관련 다운로드 데이터 |
| 19 | tab_url | VARCHAR | | ∨ | | 다운로드가 이루어진 탭의 URL |
| 20 | tab_referrer_url | VARCHAR | | ∨ | | 탭의 referrer URL |
| 21 | http_method | VARCHAR | | ∨ | | HTTP 요청 메서드 |
| 22 | by_ext_id | VARCHAR | | ∨ | | 확장 프로그램 ID |
| 23 | by_ext_name | VARCHAR | | ∨ | | 확장 프로그램 이름 |
| 24 | by_web_app_id | VARCHAR | | ∨ | | 웹 앱 ID |
| 25 | etag | VARCHAR | | ∨ | | Etag 정보 |
| 26 | last_modified | VARCHAR | | ∨ | | 마지막 수정 시각 |
| 27 | mime_type | VARCHAR(255) | | ∨ | | MIME 타입 |
| 28 | original_mime_type | VARCHAR(255) | | ∨ | | 원래의 MIME 타입 |

<br>

### 8. downloads_slices
큰 파일을 여러 조각으로 나누어 다운로드 시, 각 조각에 대한 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | download_id | INTEGER | ∨ | ∨ | | 다운로드 항목 ID |
| 2 | offset | INTEGER | ∨ | ∨ | | 바이트 오프셋 |
| 3 | received_bytes | INTEGER | | ∨ | | 받은 바이트 수 |
| 4 | finished | INTEGER | | ∨ | 0 | 해당 청크가 완료되었는지 여부 |

<br>

### 9. downloads_url_chains
다운로드된 파일의 리다이렉트 URL 체인

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | ∨ | | 다운로드 ID |
| 2 | chain_index | INTEGER | ∨ | ∨ | | 리다이렉션 체인 내 순서 |
| 3 | url | LONGVARCHAR | | ∨ | | 리다이렉션된 URL |

<br>

### 10. history_sync_metadata
히스토리 동기화와 관련된 메타데이터 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | storage_key | INTEGER | ∨ | ∨ | | 동기화 키 |
| 2 | value | BLOB | | | | 동기화된 메타데이터 값 |

<br>

### 11. keyword_search_terms
검색어와 해당 검색 결과 URL의 연결 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | keyword_id | INTEGER | | ∨ | | 검색 키워드 ID |
| 2 | url_id | INTEGER | | ∨ | | 관련 URL ID |
| 3 | term | LONGVARCHAR | | ∨ | | 사용자가 입력한 검색어 |
| 4 | normalized_term | LONGVARCHAR | | ∨ | | 정규화된 검색어 |

<br>

### 12. meta
데이터베이스 자체의 메타 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | key | LONGVARCHAR | ∨ | ∨ | | 설정 키 |
| 2 | value | LONGVARCHAR | | | | 설정 값 |

<br>

### 13. segment_usage
특정 세그먼트의 사용 정보 기록

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | ∨ | | 레코드 ID |
| 2 | segment_id | INTEGER | | ∨ | | 분석 세그먼트 ID |
| 3 | time_slot | INTEGER | | ∨ | | 시간 구간 |
| 4 | visit_count | INTEGER | | ∨ | 0 | 해당 시간 내 방문 수 |

<br>

### 14. segments
방문 URL을 기반으로 생성된 세그먼트 정보 저장

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | ∨ | | 세그먼트 ID |
| 2 | name | VARCHAR | | | | 세그먼트 이름 |
| 3 | url_id | INTEGER | | ∨ | | 연결된 URL ID |

<br>

### 15. sqlite_sequence
SQLite DB에서 AUTOINCREMENT가 설정된 테이블의 시퀀스 값 관리

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | name | | | | | AUTOINCREMENT 테이블 이름 |
| 2 | seq | | | | | 현재 사용 중인 시퀀스 값 |

<br>

### 16. urls
방문한 URL의 상세 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | | | URL의 고유 ID (AUTOINCREMENT) |
| 2 | url | LONGVARCHAR | | | | 방문한 URL |
| 3 | title | LONGVARCHAR | | | | 페이지 제목 |
| 4 | visit_count | INTEGER | | ∨ | 0 | 총 방문 수 |
| 5 | typed_count | INTEGER | | ∨ | 0 | 직접 입력한 횟수 |
| 6 | last_visit_time | INTEGER | | ∨ | | 마지막 방문 시간 |
| 7 | hidden | INTEGER | | ∨ | 0 | 히스토리 UI에서 숨김 여부 |

<br>

### 17. visit_source
방문 기록의 출처

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | ∨ | | 방문 기록 ID |
| 2 | source | INTEGER | | ∨ | | 방문 출처 (0 = 기본, 1 = 확장 등) |

<br>

### 18. visits_links
방문된 링크와 프레임 URL 관련 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | | | 고유 ID (AUTOINCREMENT) |
| 2 | link_url_id | INTEGER | | ∨ | | 링크된 URL의 ID |
| 3 | top_level_url | LONGVARCHAR | | ∨ | | 최상위 프레임의 URL |
| 4 | frame_url | LONGVARCHAR | | ∨ | | 해당 링크가 삽입된 프레임의 URL |
| 5 | visit_count | INTEGER | | ∨ | 0 | 이 링크에 대한 방문 횟수 |

<br>

### 19. visits
특정 URL에 대한 방문 기록의 상세 정보

| No. | 컬럼 이름 | 타입 | PK | NN | Default | 설명 |
|-----|----------|-----|:---:|:---:|:-----:|------|
| 1 | id | INTEGER | ∨ | | | 방문 기록 ID (AUTOINCREMENT) |
| 2 | url | INTEGER | | ∨ | | 방문한 URL의 ID |
| 3 | visit_time | INTEGER | | ∨ | | 방문한 시간 |
| 4 | from_visit | INTEGER | | | | 이전 방문 ID |
| 5 | external_referrer_url | TEXT | | | | 외부에서 참조된 URL |
| 6 | transition | INTEGER | | ∨ | 0 | 방문 방법 (검색, 클릭 등) |
| 7 | segment_id | INTEGER | | | | 관련된 세그먼트 ID |
| 8 | visit_duration | INTEGER | | ∨ | 0 | 페이지에 머문 시간 |
| 9 | incremented_omnibox_typed_score | BOOLEAN | | ∨ | FALSE | 주소창 직접 입력에 따른 점수 증가 여부 |
| 10 | opener_visit | INTEGER | | | | 탭에서 열린 visit ID |
| 11 | originator_cache_guid | TEXT | | | | 원본 방문의 캐시 GUID |
| 12 | originator_visit_id | INTEGER | | | | 원본 방문 기록 ID |
| 13 | originator_from_visit | INTEGER | | | | 원본에서 온 이전 방문 기록 |
| 14 | originator_opener_visit | INTEGER | | | | 원본의 오프너 방문 기록 ID |
| 15 | is_known_to_sync | BOOLEAN | | ∨ | FALSE | 동기화된 방문 여부 |
| 16 | consider_for_ntp_most_visited | BOOLEAN | | ∨ | FALSE | 새 탭에 추천할지 여부 |
| 17 | visited_link_id | INTEGER | | ∨ | 0 | visited_link와 연결된 링크 ID |
| 18 | app_id | TEXT | | | | 웹 앱 ID |