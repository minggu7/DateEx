// 날짜 범위 선택 컴포넌트(현재 사용중). 
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, eachDayOfInterval, startOfDay, addMonths, compareAsc, subMonths, isAfter, startOfDay as getStartOfDay, addDays, isBefore, subDays } from "date-fns";
import styled from 'styled-components';
import { useMediaQuery } from '@mui/material';
import { Box, Tooltip } from '@mui/material';

// 캘린더 스타일
const CalendarWrapper = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: start;
  
  @media (max-width: 768px) {
    gap: 0;
  }
`;

// 캘린더 컨테이너 스타일
const CalendarContainer = styled.div`
  width: 100%;
  max-width: 300px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

// 캘린더 헤더 스타일
const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
`;

// 월 버튼 스타일
const MonthButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 50%;
  font-size: 0.9rem;
  &:hover {
    background: #f0f0f0;
  }
`;

// 월 타이틀 스타일
const MonthTitle = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

// 요일 헤더 스타일
const WeekdayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  border-bottom: 1px solid #eee;
  padding: 0.25rem 0;
  background: #f8f9fa;
`;

// 요일 셀 스타일
const WeekdayCell = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
`;

// 날짜 그리드 스타일
const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #fff;
  padding: 0.25rem;
  grid-template-rows: repeat(6, 1fr);
`;

// 날짜 셀 스타일
const DayCell = styled.div`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.isDisabled ? 'not-allowed' : props.isEmpty ? 'default' : 'pointer'};
  font-size: 0.8rem;
  transition: background-color 0.2s;
  user-select: none;
  visibility: ${props => props.isEmpty ? 'hidden' : 'visible'};
  background: ${props => {
    if (props.isSelected) return '#3b82f6';
    if (props.isInRange) return '#dbeafe';
    return 'transparent';
  }};
  color: ${props => {
    if (props.isDisabled) return '#ccc';
    if (props.isSelected) return 'white';
    return 'inherit';
  }};
  opacity: ${props => props.isDisabled ? 0.5 : 1};
  padding: 0.25rem;

  &:hover {
    background: ${props => {
      if (props.isDisabled || props.isEmpty) return 'transparent';
      if (props.isSelected) return '#2563eb';
      if (props.isInRange) return '#bfdbfe';
      return '#f3f4f6';
    }};
  }
`;

// 캘린더 팝업 스타일
const CalendarPopup = styled.div`
  position: absolute;
  z-index: 99999;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 16px;
  
  // 검색 영역에서 잘리지 않도록 위치 조정
  ${props => props.isSearchSection ? `
    left: 0;  // 왼쪽 정렬
    @media (max-width: 768px) {
      left: -20px;  // 모바일에서는 약간 왼쪽으로 더 이동
    }
  ` : `
    right: 0;  // 기존처럼 오른쪽 정렬 (SearchOptions 등에서 사용)
    @media (max-width: 768px) {
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }
  `}
`;

// 날짜 입력 스타일
const DateInput = styled.div`
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  width: 260px;
  font-size: 0.875rem;
  color: ${props => props.hasValue ? '#1f2937' : '#9ca3af'};
  &:hover {
    border-color: #cbd5e1;
  }
`;

// 버튼 컨테이너 스타일
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background: white;
  border-top: 1px solid #eee;
  margin: 0 -20px;
`;

// 확인 버튼 스타일
const ConfirmButton = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: #2563eb;
  }
`;

// 메인 코드. 받는값은 시작일 ,종료일, 변경된 시작일, 변경된 종료일
const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, isSearchSection }) => {
  // 한국 시간 기준으로 today 설정
  const today = useMemo(() => {
    try {
      return startOfDay(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"})));
    } catch (e) {
      return startOfDay(new Date());
    }
  }, []);
  
  const todayFormatted = useMemo(() => {
    try {
      return format(today, "yyyy-MM-dd");
    } catch (e) {
      return format(new Date(), "yyyy-MM-dd");
    }
  }, [today]);

  const initialStartMonth = useMemo(() => {
    try {
      return subMonths(today, 1);
    } catch (e) {
      return subMonths(new Date(), 1);
    }
  }, [today]);
  
  const [currentStartMonth, setCurrentStartMonth] = useState(() => initialStartMonth);
  const [currentEndMonth, setCurrentEndMonth] = useState(() => today);
  const [selectedStartDate, setSelectedStartDate] = useState(() => todayFormatted);
  const [selectedEndDate, setSelectedEndDate] = useState(() => todayFormatted);
  const [tempStartDate, setTempStartDate] = useState(() => todayFormatted);
  const [tempEndDate, setTempEndDate] = useState(() => todayFormatted);
  const [hoverDate, setHoverDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:768px)');

  // 모든 Hooks를 최상단으로 이동
  const sortDates = useCallback((date1, date2) => {
    try {
      if (!date1 || !date2) return [date1, date2];
      const firstDate = new Date(date1);
      const secondDate = new Date(date2);
      return firstDate <= secondDate ? [date1, date2] : [date2, date1];
    } catch (e) {
      return [date1, date2];
    }
  }, []);

  // 범위 계산 함수
  const getRange = useCallback((start, end) => {
    try {
      if (!start || !end) return [];
      const startDate = new Date(start);
      const endDate = new Date(end);
      return eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(endDate)
      }).map(date => format(date, "yyyy-MM-dd"));
    } catch (e) {
      return [];
    }
  }, []);

  // 날짜 문자열을 Date 객체로 변환하는 헬퍼 함수
  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      // YYYYMMDD 형식의 문자열을 Date 객체로 변환
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return new Date(year, month - 1, day);
    } catch (e) {
      console.error('Date parsing error:', e);
      return null;
    }
  };

  // 날짜 범위 포맷 함수
  const formatDateRange = () => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = parseDate(dateString);
      if (!date) return '';
      try {
        return format(date, 'yyyy-MM-dd');
      } catch (e) {
        console.error('Date formatting error:', e);
        return '';
      }
    };

    if (!startDate && !endDate) return '기간 선택';
    if (!endDate) return `${formatDate(startDate)} ~`;
    if (!startDate) return `~ ${formatDate(endDate)}`;
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  // 초기값 설정
  useEffect(() => {
    if (!startDate && !endDate) {
      try {
        const displayToday = format(today, 'yyyyMMdd');
        onStartDateChange(displayToday);
        onEndDateChange(displayToday);
        
        console.log('DateRangePicker 초기값 설정');
        console.log('시작일:', displayToday);
        console.log('종료일:', displayToday);
      } catch (e) {
        console.error('Date initialization error:', e);
      }
    }
  }, []);

  // 초기값 설정
  useEffect(() => {
    try {
      if (!selectedStartDate || !selectedEndDate) {
        setSelectedStartDate(todayFormatted);
        setSelectedEndDate(todayFormatted);
      }
    } catch (e) {
      console.error('Date initialization error:', e);
    }
  }, [todayFormatted, selectedStartDate, selectedEndDate]);

  // 캘린더 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDragging) return;
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDragging]);

  if (!currentStartMonth || !currentEndMonth || !todayFormatted) {
    return null;
  }

  const handleDateSelection = (formatted) => {
    const selectedDate = new Date(formatted);
    // 한국 시간 기준으로 tomorrow 설정
    const tomorrow = startOfDay(addDays(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"})), 1));

    // 내일 이후 날짜만 제한
    if (!isBefore(selectedDate, tomorrow)) {
      return;
    }

    // 드래그 중이 아닐 때의 클릭 이벤트
    if (!isDragging) {
      // 이미 선택된 날짜 클릭 시 초기화
      if (formatted === tempStartDate || formatted === tempEndDate) {
        setTempStartDate(null);
        setTempEndDate(null);
        return;
      }

      // 첫 번째 선택
      if (!tempStartDate && !tempEndDate) {
        setTempStartDate(formatted);
        setTempEndDate(null);
        return;
      }

      // 두 번째 선택 - 순서 상관없이 범위 설정
      const [start, end] = sortDates(tempStartDate, formatted);
      setTempStartDate(start);
      setTempEndDate(end);
      return;
    }

    // 드래그 시작
    if (isDragging && !tempStartDate) {
      setTempStartDate(formatted);
      setTempEndDate(formatted);
      return;
    }

    // 드래그 중
    if (isDragging && tempStartDate) {
      const [start, end] = sortDates(tempStartDate, formatted);
      setTempStartDate(start);
      setTempEndDate(end);
    }
  };

  // 확인 버튼 클릭 시 날짜 선택 확인
  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      try {
        const formattedStartDate = format(new Date(tempStartDate), 'yyyyMMdd');
        const formattedEndDate = format(new Date(tempEndDate), 'yyyyMMdd');

        console.log('DateRangePicker 날짜 선택 확인');
        console.log('시작일:', formattedStartDate);
        console.log('종료일:', formattedEndDate);

        onStartDateChange(formattedStartDate);
        onEndDateChange(formattedEndDate);
      } catch (e) {
        console.error('Date formatting error:', e);
      }
    }
    setIsOpen(false);
  };

  const selectedRange = tempStartDate && tempEndDate 
    ? getRange(tempStartDate, tempEndDate)
    : [];

  function generateMonthDays(date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // 현재 달의 날짜들만 반환
    return eachDayOfInterval({ 
      start: firstDayOfMonth, 
      end: lastDayOfMonth 
    }).map(day => ({
      date: day,
      formatted: format(day, "yyyy-MM-dd")
    }));
  }

  const SingleCalendar = ({ 
    currentMonth, 
    setCurrentMonth
  }) => {
    // 한국 시간 기준으로 tomorrow 설정
    const tomorrow = startOfDay(addDays(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"})), 1));
    
    const days = generateMonthDays(currentMonth);
    const emptyDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    // 항상 6주 표시를 위한 계산
    const totalDays = days.length + emptyDays;
    const remainingCells = 42 - totalDays; // 6주 x 7일 = 42칸

    // 메인 코드
    return (
      <CalendarContainer>
        <CalendarHeader>
          <MonthButton onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}>
            ←
          </MonthButton>
          <MonthTitle>{format(currentMonth, "yyyy년 MM월")}</MonthTitle>
          <MonthButton onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
            →
          </MonthButton>
        </CalendarHeader>

        <WeekdayHeader>
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <WeekdayCell key={day}>{day}</WeekdayCell>
          ))}
        </WeekdayHeader>

        <DaysGrid>
          {Array.from({ length: emptyDays }).map((_, index) => (
            <DayCell key={`empty-start-${index}`} isEmpty />
          ))}
          
          {days.map(({ date, formatted }) => {
            const isSelected = formatted === tempStartDate || formatted === tempEndDate;
            const isInRange = tempStartDate && tempEndDate && 
              new Date(formatted) >= new Date(tempStartDate) && 
              new Date(formatted) <= new Date(tempEndDate);
            // 내일 이후 날짜만 제한
            const isDisabled = !isBefore(date, tomorrow);

            return (
              <DayCell
                key={formatted}
                isSelected={isSelected}
                isInRange={isInRange}
                isDisabled={isDisabled}
                onMouseDown={(e) => {
                  if (!isDisabled) {
                    e.preventDefault();
                    setIsDragging(true);
                    handleDateSelection(formatted);
                  }
                }}
                onMouseEnter={() => {
                  if (!isDisabled && isDragging) {
                    handleDateSelection(formatted);
                  }
                }}
                onClick={() => {
                  if (!isDisabled && !isDragging) {
                    handleDateSelection(formatted);
                  }
                }}
              >
                {date.getDate()}
              </DayCell>
            );
          })}

          {Array.from({ length: remainingCells }).map((_, index) => (
            <DayCell key={`empty-end-${index}`} isEmpty />
          ))}
        </DaysGrid>
      </CalendarContainer>
    );
  };

  return (
    <div ref={calendarRef} style={{ position: 'relative' }}>
      <DateInput 
        onClick={() => setIsOpen(!isOpen)}
        hasValue={startDate || endDate}
      >
        {formatDateRange()}
      </DateInput>
      
      {isOpen && (
        <CalendarPopup isSearchSection={isSearchSection}>
          <CalendarWrapper
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <SingleCalendar
              currentMonth={currentStartMonth}
              setCurrentMonth={setCurrentStartMonth}
            />
            {!isMobile && (
              <SingleCalendar
                currentMonth={currentEndMonth}
                setCurrentMonth={setCurrentEndMonth}
              />
            )}
          </CalendarWrapper>

          <ButtonContainer>
            <ConfirmButton onClick={handleConfirm}>
              확인
            </ConfirmButton>
          </ButtonContainer>
        </CalendarPopup>
      )}
    </div>
  );
};

export default DateRangePicker; 


도커, 쉘스크립트 관련 파일

도커 설명

# 1단계: Node.js 이미지를 기반으로 리액트 앱 빌드
FROM node:18-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# 비root 사용자 생성
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# package.json 및 package-lock.json 파일을 복사해서 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사 및 리액트 앱 빌드
COPY . .
RUN npm run build

# 2단계: 빌드된 리액트 앱을 Node.js로 서빙
FROM node:18-alpine

WORKDIR /app

# 비root 사용자 생성
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# serve 패키지 설치
RUN npm install -g serve

# 빌드된 파일을 복사
COPY --from=build /app/build /app/build

# 사용자 변경
USER appuser

# 8888 포트 열기
EXPOSE 8888

# 빌드된 정적 파일을 서빙할 때 8888 포트 사용
CMD ["serve", "-s", "build", "-l", "8888"]



쉘스크립트 예시 deploy.sh
#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/4] 도커 이미지 빌드 시작...${NC}"
docker build -t react-app:latest .

echo -e "${YELLOW}[2/4] 기존 컨테이너 제거 중...${NC}"
docker rm -f react-app || true

echo -e "${YELLOW}[3/4] 새 컨테이너 실행 중...${NC}"
docker run -d \
  --name react-app \
  -p 8888:8888 \
  --restart unless-stopped \
  react-app:latest

echo -e "${YELLOW}[4/4] 컨테이너 상태 확인 중...${NC}"
docker ps | grep react-app

# 컨테이너가 정상적으로 실행되었는지 확인
if [ $? -eq 0 ]; then
    echo -e "${GREEN}배포가 성공적으로 완료되었습니다!${NC}"
    echo -e "${GREEN}접속 주소: http://localhost:8888${NC}"
else
    echo -e "\033[0;31m배포 중 문제가 발생했습니다. 로그를 확인해주세요.${NC}"
    docker logs react-app
    exit 1
fi 


도커 설정파일 setup-docker.sh

#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}도커 권한 설정을 시작합니다...${NC}"

# 도커 그룹이 없다면 생성
if ! getent group docker > /dev/null 2>&1; then
    echo -e "${YELLOW}도커 그룹 생성 중...${NC}"
    sudo groupadd docker
fi

# 현재 사용자를 도커 그룹에 추가
echo -e "${YELLOW}사용자를 도커 그룹에 추가하는 중...${NC}"
sudo usermod -aG docker $USER

# 도커 서비스 재시작
echo -e "${YELLOW}도커 서비스 재시작 중...${NC}"
sudo systemctl restart docker

echo -e "${GREEN}설정이 완료되었습니다.${NC}"
echo -e "${YELLOW}변경사항을 적용하기 위해 시스템을 다시 로그인하거나 다음 명령어를 실행하세요:${NC}"
echo -e "${GREEN}newgrp docker${NC}" 


위와 이어지는 캐디!!!!!!!!!!!!!!!!!!!!!!!!

캐디 설치부터 설정까지 

시스템의 패키지 목록을 업데이트(설치 전 그냥 진행)
sudo apt update

캐디 수동 설치 명령어
wget https://github.com/caddyserver/caddy/releases/download/v2.6.4/caddy_2.6.4_linux_amd64.tar.gz


수동 설치 후 압축 해제
tar -xvzf caddy_2.6.4_linux_amd64.tar.gz


Caddy 바이너리 이동
Caddy 바이너리를 시스템의 실행 경로로 이동시킵니다.

실행 권한 부여
Caddy 바이너리에 실행 권한을 부여합니다.

Caddy 버전 확인
Caddy 설치가 완료되었으면, 다음 명령어로 설치된 버전을 확인합니다.

Caddy 서비스 시작
Caddy를 서비스로 실행하려면, 아래 명령어를 사용하여 시스템 서비스로 등록하고 실행할 수 있습니다.

# Caddy 서비스 시작
sudo systemctl start caddy

# Caddy 서비스가 자동으로 시작되도록 설정
sudo systemctl enable caddy



 Caddy 서비스 파일 작성
Caddy를 시스템 서비스로 등록하려면 서비스 파일을 작성해야 합니다. 다음 명령어로 /etc/systemd/system/caddy.service 파일을 만듭니다.
sudo nano /etc/systemd/system/caddy.service


파일 내용은 아래와 같이 작성해 주세요:

[Unit]
Description=Caddy HTTP/2 web server
Documentation=https://caddyserver.com/docs/
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
Restart=on-failure
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target


Caddy 서비스 파일 리로드
시스템이 새로운 서비스 파일을 인식하도록 systemd를 리로드합니다.

Caddy 서비스 시작
이제 Caddy를 서비스로 시작할 수 있습니다.

sudo systemctl start caddy

Caddy 서비스 자동 시작 설정
서버가 재부팅되었을 때 자동으로 Caddy가 실행되도록 설정합니다.
sudo systemctl enable caddy


Caddy가 정상적으로 실행되고 있는지 확인하려면 다음 명령어를 사용합니다.
sudo systemctl status caddy

단계: Caddy 버전 확인
Caddy가 정상적으로 실행되면, 버전을 확인하여 제대로 설치되었는지 확인할 수 있습니다.

caddy version


1단계: Caddy 서비스 로그 확인
우선, Caddy가 왜 실패했는지 더 자세한 로그를 확인해야 합니다. 아래 명령어를 사용하여 추가적인 로그를 확인할 수 있습니다.


sudo journalctl -u caddy.service
이 명령어를 실행하면 Caddy의 서비스 로그가 출력됩니다. 그 내용을 통해 오류의 원인을 파악할 수 있습니다.

2단계: Caddy 실행 파일 확인
ExecStart 경로가 /usr/local/bin/caddy로 설정되어 있는데, 해당 경로에 Caddy 실행 파일이 실제로 존재하는지 확인해 보세요. 아래 명령어로 확인할 수 있습니다.


ls -l /usr/local/bin/caddy
만약 해당 파일이 없다면, Caddy 실행 파일이 잘못 설치된 것일 수 있습니다. 이전에 다운로드한 Caddy 바이너리를 다시 /usr/local/bin/ 경로로 이동시켜야 합니다.


sudo mv /path/to/caddy /usr/local/bin/caddy
sudo chmod +x /usr/local/bin/caddy

3단계: Caddy 설정 파일 확인
또한 Caddy의 설정 파일(Caddyfile)이 /etc/caddy/에 있는지 확인하세요. 설정 파일이 없다면, 예시 파일을 만들어야 합니다.


sudo mkdir -p /etc/caddy
sudo nano /etc/caddy/Caddyfile

Caddyfile의 기본 예시는 다음과 같습니다:

imcrew.kr {
  reverse_proxy localhost:8888
}

peakme.kr {
  reverse_proxy localhost:8888
}
이 파일을 저장한 후 Caddy 서비스를 다시 시작해 보세요.

4단계: Caddy 서비스 다시 시작
위의 조치를 취한 후, Caddy 서비스를 다시 시작해보세요.


sudo systemctl daemon-reload
sudo systemctl start caddy
sudo systemctl status caddy

5단계: Caddy 자동 시작 설정
서비스가 정상적으로 실행되면, Caddy를 시스템 시작 시 자동으로 시작되도록 설정합니다.

sudo systemctl enable caddy


여기서 캐디가 파일 읽지 못하는 오류남.

1단계: Caddyfile 위치 확인
Caddy가 설정 파일을 읽지 못하는 이유는 설정 파일이 없거나 올바른 위치에 배치되지 않았기 때문일 수 있습니다. /etc/caddy/ 디렉터리에 Caddyfile이 있는지 확인해보세요:


sudo ls /etc/caddy/

2단계: Caddyfile 생성 및 권한 설정
/etc/caddy/Caddyfile을 생성하여 아래와 같은 내용으로 설정해 보세요.

txt

imcrew.kr {
  reverse_proxy localhost:8888
}

peakme.kr {
  reverse_proxy localhost:8888
}
파일을 저장한 후 권한을 확인하고, 필요하면 권한을 변경합니다:

bash

sudo chmod 644 /etc/caddy/Caddyfile

3단계: Caddy 서비스 다시 시작
Caddyfile을 올바르게 설정한 후, Caddy 서비스를 다시 시작해 보세요.


sudo systemctl daemon-reload
sudo systemctl start caddy
sudo systemctl status caddy

/etc/caddy/ 디렉터리가 존재하지 않는다면, Caddy 설정 파일(Caddyfile)을 저장할 디렉터리를 새로 생성해야 합니다. 다음 단계를 따라해 보세요:

1단계: 디렉터리 생성
먼저 /etc/caddy/ 디렉터리를 생성합니다:


sudo mkdir -p /etc/caddy
2단계: Caddyfile 생성
디렉터리를 만든 후, Caddyfile을 해당 디렉터리에 생성합니다:


sudo nano /etc/caddy/Caddyfile
그리고 아래와 같은 내용을 추가합니다:


imcrew.kr {
  reverse_proxy localhost:8888
}

peakme.kr {
  reverse_proxy localhost:8888
}
파일을 저장하고 닫습니다 (Ctrl + X, Y, Enter).

3단계: 권한 설정
Caddy가 해당 파일을 읽을 수 있도록 권한을 설정합니다:


sudo chmod 644 /etc/caddy/Caddyfile
4단계: Caddy 서비스 시작
이제 Caddy 서비스를 다시 시작합니다:


sudo systemctl daemon-reload
sudo systemctl start caddy
sudo systemctl status caddy

bash
복사
편집
sudo systemctl restart caddy
이 명령으로 Caddy 서비스를 재시작하여 설정을 적용할 수 있습니다.

서비스 상태 확인: Caddy 서비스가 정상적으로 실행되고 있는지 확인합니다.

bash
복사
편집
sudo systemctl status caddy
서비스가 정상적으로 실행되면 Active: active (running) 상태가 표시되어야 합니다.

방화벽 설정 (필요한 경우): 서버의 방화벽이 열려 있는지 확인하고, 필요한 포트를 열어줍니다. 8888 포트와 80, 443 (HTTP, HTTPS)를 열어야 할 수 있습니다.

예시 (UFW 사용 시):

bash
복사
편집
sudo ufw allow 80,443,8888/tcp


오류 발생. 권한 확인 한번하고 그래도 오류나면?
엔진엑스 포트 충돌 오류였음.

1. caddy 사용자 및 그룹 생성
bash
복사
편집
sudo useradd -r -s /usr/sbin/nologin caddy
sudo groupadd caddy
2. Caddyfile 권한 변경
그런 다음, Caddyfile의 소유자를 caddy 사용자와 그룹으로 변경할 수 있습니다:

bash
복사
편집
sudo chown caddy:caddy /etc/caddy/Caddyfile
3. Caddy 서비스 다시 시작
권한을 설정한 후, Caddy 서비스를 다시 시작해 보세요:

bash
복사
편집
sudo systemctl restart caddy
4. 포트 충돌 확인
포트 충돌을 확인하려면, Caddy가 사용하는 기본 포트인 80, 443이 다른 프로세스에 의해 사용 중인지 확인해야 합니다. 아래 명령어로 포트를 사용 중인 프로세스를 확인할 수 있습니다:

bash
복사
편집
sudo lsof -i :80
sudo lsof -i :443

. 포트 80을 사용하는 프로세스 종료
포트 80을 사용 중인 프로세스를 찾아 종료한 후 Caddy를 재시작할 수 있습니다.

포트 80을 사용하는 프로세스 확인
bash
복사
편집
sudo lsof -i :80
이 명령을 사용하여 포트 80을 사용 중인 프로세스를 찾습니다. 그런 다음 해당 프로세스를 종료할 수 있습니다.

프로세스 종료
프로세스의 PID를 확인한 후 아래 명령으로 종료합니다:

bash
복사
편집
sudo kill -9 <PID>


**이건 캐디를 다른포트에서 돌리는 방법**

. Caddy가 다른 포트를 사용하도록 설정
Caddy가 포트 80을 사용하지 않도록 설정하고, 다른 포트에서 HTTP 서비스를 실행하도록 변경할 수 있습니다.

Caddyfile을 열어 포트 80 대신 다른 포트를 사용하도록 설정하세요. 예를 들어 포트 8080을 사용하도록 수정할 수 있습니다:

text
복사
편집
:8080 {
    reverse_proxy localhost:8888
}
이후 Caddy를 재시작하여 적용하세요:

bash
복사
편집
sudo systemctl restart caddy
위 방법 중 하나를 시도하여 문제를 해결할 수 있습니다.

Nginx 중지 방법
Nginx 서비스를 중지합니다:

bash
복사
편집
sudo systemctl stop nginx
Nginx가 자동으로 시작되지 않도록 비활성화합니다:

bash
복사
편집
sudo systemctl disable nginx
이후 Caddy 재시작
Nginx가 중지되면 Caddy가 포트 80을 사용할 수 있습니다. 이제 Caddy를 재시작하세요:

bash
복사
편집
sudo systemctl restart caddy

좋아요! deploy.sh 파일을 실행하는 방식으로 배포할 수 있습니다. 이 파일은 도커 이미지를 빌드하고, 기존 컨테이너를 제거한 뒤 새 컨테이너를 실행하는 작업을 포함하고 있어요.

배포 절차를 진행하려면 아래 단계를 따라주세요:

도커 권한 설정
setup-docker.sh 파일을 실행해 도커 권한 설정을 완료해주세요. 이 스크립트는 도커 그룹 설정과 권한을 추가합니다. newgrp docker 명령어로 변경 사항을 즉시 적용할 수 있습니다.

배포 스크립트 실행
deploy.sh 파일을 실행해서 도커 이미지를 빌드하고 새로운 컨테이너를 실행하세요. 터미널에서 아래 명령을 입력합니다:

bash
복사
편집
./deploy.sh
컨테이너 상태 확인
스크립트에서 마지막에 컨테이너 상태를 확인하고 성공적으로 실행되었는지 알려줍니다. 문제가 생기면 docker logs react-app을 통해 로그를 확인할 수 있습니다.

이 절차대로 진행하면 리액트 앱이 도커 컨테이너에서 실행되고, http://localhost:8888에서 접근할 수 있게 됩니다. Caddy를 통해 리버스 프록시 설정도 완료된 상태라면, 도메인으로 접근할 수 있을 것입니다.

이제 배포가 잘 진행되면, 설정한 도메인으로도 연결을 시도해보세요.
