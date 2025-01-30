import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { format, eachDayOfInterval, startOfDay, addMonths, compareAsc, subMonths, isAfter, startOfDay as getStartOfDay, addDays, isBefore } from "date-fns";
import styled from 'styled-components';

const CalendarWrapper = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: start;
`;

const CalendarContainer = styled.div`
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
`;

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

const MonthTitle = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const WeekdayHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  border-bottom: 1px solid #eee;
  padding: 0.25rem 0;
  background: #f8f9fa;
`;

const WeekdayCell = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #fff;
  padding: 0.25rem;
  grid-template-rows: repeat(6, 1fr);
`;

const DayCell = styled.div`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.isDisabled ? 'not-allowed' : props.isEmpty ? 'default' : 'pointer'};
  font-size: 0.9rem;
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
  padding: 0.5rem;

  &:hover {
    background: ${props => {
      if (props.isDisabled || props.isEmpty) return 'transparent';
      if (props.isSelected) return '#2563eb';
      if (props.isInRange) return '#bfdbfe';
      return '#f3f4f6';
    }};
  }
`;

const CalendarPopup = styled.div`
  position: absolute;
  z-index: 1000;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 20px 20px 0 20px;
`;

const DateInput = styled.div`
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  width: fit-content;
  font-size: 0.875rem;
  color: ${props => props.hasValue ? '#1f2937' : '#9ca3af'};
  &:hover {
    border-color: #cbd5e1;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background: white;
  border-top: 1px solid #eee;
  margin: 0 -20px;
`;

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

const Calendar = () => {
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

  // 날짜 관련 함수들을 try-catch로 감싸기
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

  // 컴포넌트가 마운트될 때 날짜 초기화 확인
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

  const handleConfirm = () => {
    setSelectedStartDate(tempStartDate);
    setSelectedEndDate(tempEndDate);
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

  const formatDateRange = () => {
    if (!selectedStartDate && !selectedEndDate) {
      return "기간 선택";
    }
    if (selectedStartDate && !selectedEndDate) {
      return format(new Date(selectedStartDate), "MM.dd");
    }
    return `${format(new Date(selectedStartDate), "MM.dd")} - ${format(new Date(selectedEndDate), "MM.dd")}`;
  };

  return (
    <div ref={calendarRef} style={{ position: 'relative' }}>
      <DateInput 
        onClick={() => setIsOpen(!isOpen)}
        hasValue={selectedStartDate || selectedEndDate}
      >
        {formatDateRange()}
      </DateInput>
      
      {isOpen && (
        <CalendarPopup>
          <CalendarWrapper
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <SingleCalendar
              currentMonth={currentStartMonth}
              setCurrentMonth={setCurrentStartMonth}
            />
            <SingleCalendar
              currentMonth={currentEndMonth}
              setCurrentMonth={setCurrentEndMonth}
            />
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

export default Calendar; 