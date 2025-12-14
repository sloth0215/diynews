import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/pages/Index";

interface CalendarViewProps {
  posts: Post[];
  bookmarks: string[];
}

const extractDates = (text: string): Date[] => {
  const year = new Date().getFullYear();
  const matches = [...text.matchAll(/(\d{1,2})[\/-](\d{1,2})/g)];
  return matches.map((m) => new Date(year, Number(m[1]) - 1, Number(m[2])));
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('ko-KR', { 
    month: 'numeric', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const CalendarView = ({ posts, bookmarks }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date()); 

  const scheduledEvents = useMemo(() => {
    const events: Array<{
      date: Date;
      title: string;
      source: string;
      bookmarked: boolean;
      color: string;
    }> = [];
    
    const colors = ["bg-rose-400", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400"];
    
    posts.forEach((post, index) => {
      // 1. scheduleDate 필드 확인 (우선순위)
      if (post.hasSchedule && post.scheduleDate) {
        try {
          const scheduleDate = new Date(post.scheduleDate);
          if (!isNaN(scheduleDate.getTime())) {
            events.push({
              date: scheduleDate,
              title: post.title,
              source: post.author,
              bookmarked: bookmarks.includes(post.id),
              color: colors[index % colors.length]
            });
          }
        } catch (e) {
          console.error('날짜 파싱 실패:', post.scheduleDate, e);
        }
      }
      
      // 2. 텍스트에서 날짜 추출 (폴백)
      const dates = extractDates(post.title + " " + post.content);
      dates.forEach(d => {
        events.push({
          date: d,
          title: post.title,
          source: post.author,
          bookmarked: bookmarks.includes(post.id),
          color: colors[index % colors.length]
        });
      });
    });
    
    return events;
  }, [posts, bookmarks]);

  // 🎯 선택된 날짜의 일정만 필터링
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return scheduledEvents.filter(e => {
      return e.date.getDate() === selectedDate.getDate() && 
             e.date.getMonth() === selectedDate.getMonth() &&
             e.date.getFullYear() === selectedDate.getFullYear();
    });
  }, [selectedDate, scheduledEvents]);

  // 🎯 달력 셀 클릭 핸들러
  const handleDateClick = (dayNumber: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">일정 캘린더</h2>
          <p className="text-sm text-muted-foreground">날짜를 클릭하여 일정을 확인하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4 md:p-6 shadow-[var(--shadow-card)]">
          <div className="hidden md:block">
            {/* 데스크톱 캘린더 */}
            <div>
              {/* 월 선택 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentMonth(newDate);
                  }}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  ←
                </button>
                
                <h3 className="text-lg font-semibold">
                  {currentMonth.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })}
                </h3>
                
                <button
                  onClick={() => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentMonth(newDate);
                  }}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                  const startDay = firstDay.getDay();
                  const dayNumber = i - startDay + 1;
                  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                  
                  if (dayNumber < 1 || dayNumber > daysInMonth) {
                    return <div key={i} className="h-20" />;
                  }
                  
                  const dayEvents = scheduledEvents.filter(e => {
                    const eventDate = e.date;
                    return eventDate.getDate() === dayNumber && 
                           eventDate.getMonth() === currentMonth.getMonth() &&
                           eventDate.getFullYear() === currentMonth.getFullYear();
                  });
                  
                  const today = new Date();
                  const isToday = dayNumber === today.getDate() && 
                                  currentMonth.getMonth() === today.getMonth() &&
                                  currentMonth.getFullYear() === today.getFullYear();
                  
                  const isSelected = selectedDate && 
                                    dayNumber === selectedDate.getDate() && 
                                    currentMonth.getMonth() === selectedDate.getMonth() &&
                                    currentMonth.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleDateClick(dayNumber)}
                      className={`relative border rounded-lg p-2 h-20 hover:bg-accent transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary/20 border-primary' : isToday ? 'bg-primary/10 border-primary' : 'border-border'
                      }`}
                    >
                      <span className={`text-sm font-medium ${isToday || isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div 
                              key={idx} 
                              className={`w-2 h-2 rounded-full ${event.color}`}
                              title={event.title}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Mobile Calendar Grid */}
          <div className="md:hidden">
            {/* 월 선택 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors"
              >
                ←
              </button>
              
              <h3 className="text-sm font-semibold">
                {currentMonth.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })}
              </h3>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors"
              >
                →
              </button>
            </div>
            
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-4">
              {Array.from({ length: 35 }, (_, i) => {
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const startDay = firstDay.getDay();
                const dayNumber = i - startDay + 1;
                const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                
                if (dayNumber < 1 || dayNumber > daysInMonth) {
                  return <div key={i} className="h-12" />;
                }
                
                const dayEvents = scheduledEvents.filter(e => {
                  const eventDate = e.date;
                  return eventDate.getDate() === dayNumber && 
                         eventDate.getMonth() === currentMonth.getMonth() &&
                         eventDate.getFullYear() === currentMonth.getFullYear();
                });
                
                const today = new Date();
                const isToday = dayNumber === today.getDate() && 
                                currentMonth.getMonth() === today.getMonth() &&
                                currentMonth.getFullYear() === today.getFullYear();
                
                const isSelected = selectedDate && 
                                  dayNumber === selectedDate.getDate() && 
                                  currentMonth.getMonth() === selectedDate.getMonth() &&
                                  currentMonth.getFullYear() === selectedDate.getFullYear();
                
                return (
                  <div 
                    key={i} 
                    onClick={() => handleDateClick(dayNumber)}
                    className={`relative border rounded-md h-12 cursor-pointer ${
                      isSelected ? 'bg-primary/20 border-primary' : isToday ? 'bg-primary/10 border-primary' : 'border-border bg-card'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 text-[10px] ${
                      isToday || isSelected ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}>
                      {dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((e, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${e.color}`}></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* 선택된 날짜의 일정 패널 */}
        <div className="space-y-4">
          <Card className="p-4 shadow-[var(--shadow-card)]">
            <h3 className="font-semibold text-sm md:text-base text-foreground mb-3">
              {selectedDate ? selectedDate.toLocaleString('ko-KR', { month: 'long', day: 'numeric' }) : '날짜 선택'} 일정
            </h3>
            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">이 날짜에 예정된 일정이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="p-2.5 md:p-3 rounded-lg bg-subtle border border-border hover:border-highlight/30 transition-[var(--transition-smooth)] cursor-pointer"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <div className={`w-3 h-3 rounded-full ${event.color} shrink-0 mt-0.5`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs md:text-sm text-foreground truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] md:text-xs">
                            {event.source}
                          </Badge>
                          {event.bookmarked && (
                            <span className="text-xs text-highlight">★</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] md:text-xs text-highlight font-medium ml-5">
                      {formatDateTime(event.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;