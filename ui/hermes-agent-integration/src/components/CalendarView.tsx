import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  X,
  Trash2,
  Search,
  ChevronDown,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudSun,
  CloudFog,
  Info,
  Wind,
  Navigation,
} from "lucide-react";
import { CalendarEvent } from "../types";
import { getHolidays, Holiday } from "../services/holidayService";

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

type ViewMode = "year" | "month" | "week" | "day" | "agenda";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CITIES = [
  { name: "București", lat: 44.4268, lon: 26.1025 },
  { name: "Cluj-Napoca", lat: 46.7712, lon: 23.6236 },
  { name: "Timișoara", lat: 45.7489, lon: 21.2087 },
  { name: "Iași", lat: 47.1585, lon: 27.6014 },
  { name: "Constanța", lat: 44.1733, lon: 28.6383 },
  { name: "Berlin", lat: 52.52, lon: 13.405 },
  { name: "Munich", lat: 48.1351, lon: 11.582 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
];

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const WeatherWidget = ({ selectedDate }: { selectedDate: Date }) => {
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    code: number;
    wind: number;
  } | null>(null);
  const [location, setLocation] = useState({
    name: "București",
    lat: 44.4268,
    lon: 26.1025,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchWeather = async (
    lat: number,
    lon: number,
    name?: string,
    targetDate?: Date,
  ) => {
    try {
      const isTargetToday = isSameDay(targetDate || new Date(), new Date());
      let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`;

      if (!isTargetToday && targetDate) {
        const dateStr = targetDate.toISOString().split("T")[0];
        url += `&daily=weathercode,temperature_2m_max&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
      } else {
        url += `&current_weather=true`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!isTargetToday && data.daily) {
        setWeather({
          temp: Math.round(data.daily.temperature_2m_max[0]),
          condition: getWeatherCondition(data.daily.weathercode[0]),
          code: data.daily.weathercode[0],
          wind: 0,
        });
      } else if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode),
          code: data.current_weather.weathercode,
          wind: Math.round(data.current_weather.windspeed),
        });
      }
      if (name) setLocation({ name, lat, lon });
    } catch (e) {
      console.error("Weather fetch failed", e);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=5&language=en&format=json`,
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error("Geocoding failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const getWeatherCondition = (code: number) => {
    if (code === 0) return "Sunny";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 57) return "Drizzle";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Rain Showers";
    if (code <= 86) return "Snow Showers";
    if (code <= 99) return "Thunderstorm";
    return "Clear";
  };

  useEffect(() => {
    fetchWeather(location.lat, location.lon, location.name, selectedDate);
  }, [location.lat, location.lon, selectedDate]);

  const getWeatherIcon = (code: number, size = 20) => {
    const iconProps = {
      size,
      className:
        "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-150",
    };

    if (code === 0)
      return (
        <Sun
          {...iconProps}
          className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
        />
      );
    if (code <= 3)
      return (
        <div className="relative">
          <Sun
            size={size * 0.7}
            className="text-yellow-400 absolute -top-1 -right-1 opacity-80"
          />
          <CloudSun {...iconProps} className="text-pplx-muted" />
        </div>
      );
    if (code <= 48)
      return <CloudFog {...iconProps} className="text-pplx-muted" />;
    if (code <= 57)
      return <CloudRain {...iconProps} className="text-blue-300" />;
    if (code <= 67)
      return <CloudRain {...iconProps} className="text-blue-400" />;
    if (code <= 77) return <CloudSnow {...iconProps} className="text-white" />;
    if (code <= 82)
      return <CloudRain {...iconProps} className="text-blue-500" />;
    if (code <= 86)
      return <CloudSnow {...iconProps} className="text-blue-100" />;
    if (code <= 99)
      return <CloudLightning {...iconProps} className="text-purple-400" />;
    return <Sun {...iconProps} className="text-yellow-400" />;
  };

  if (!weather)
    return (
      <div className="flex items-center gap-4 px-2 py-0.5 opacity-50 w-[160px] h-[36px]">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-[48px] h-[32px] bg-pplx-hover rounded-lg" />
          <div className="w-[28px] h-[28px] bg-pplx-hover rounded-full" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="w-16 h-2 bg-pplx-hover rounded" />
          <div className="w-12 h-2 bg-pplx-hover rounded" />
        </div>
      </div>
    );

  return (
    <div className="relative">
      <div
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-4 px-2 py-0.5 transition-all cursor-pointer group w-[160px] h-[36px]"
      >
        {/* Left: Temp & Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-3xl font-serif font-light text-pplx-text leading-none tracking-tight">
            {weather.temp}°
          </span>
          <div className="group-hover:scale-110 transition-transform duration-150 ease-out">
            {getWeatherIcon(weather.code, 28)}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1">
            <MapPin size={8} className="text-blue-400/70 shrink-0" />
            <span className="text-[9px] text-pplx-muted font-bold uppercase tracking-widest truncate">
              {location.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-pplx-muted font-bold uppercase tracking-wider leading-tight truncate">
              {weather.condition}
            </span>
            {weather.wind > 0 && (
              <div className="flex items-center gap-1 text-[8px] text-pplx-muted border-l border-pplx-border pl-2 shrink-0">
                <Wind size={8} />
                <span>{weather.wind}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[120]"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-full left-0 mt-3 w-60 bg-pplx-card border border-pplx-border rounded-[20px] shadow-2xl z-[121] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-pplx-border bg-pplx-hover/20 space-y-3">
              <div className="text-[9px] font-black text-pplx-muted uppercase tracking-[0.2em]">
                Locație
              </div>

              <form onSubmit={handleManualSearch} className="relative">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Caută oraș..."
                  className="w-full bg-pplx-input border border-pplx-border rounded-lg px-3 py-1.5 text-[11px] text-pplx-text placeholder:text-pplx-muted focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pplx-muted hover:text-pplx-text transition-colors"
                >
                  {isSearching ? (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar border-t border-pplx-border pt-2">
                  <div className="text-[8px] font-bold text-pplx-muted uppercase tracking-wider mb-1">
                    Rezultate căutare
                  </div>
                  {searchResults.map((city, idx) => (
                    <button
                      key={`${city.id}-${idx}`}
                      onClick={() => {
                        fetchWeather(
                          city.latitude,
                          city.longitude,
                          city.name,
                          selectedDate,
                        );
                        setIsMenuOpen(false);
                        setSearchCity("");
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-blue-500/10 rounded-lg text-[10px] text-pplx-text transition-all border border-transparent hover:border-blue-500/20"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold">{city.name}</span>
                        <span className="text-[8px] text-pplx-muted">
                          {city.admin1 ? `${city.admin1}, ` : ""}
                          {city.country}
                        </span>
                      </div>
                      <ChevronRight size={10} className="text-pplx-muted" />
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    fetchWeather(
                      pos.coords.latitude,
                      pos.coords.longitude,
                      "Locația Ta",
                      selectedDate,
                    );
                    setIsMenuOpen(false);
                  });
                }}
                className="w-full flex items-center gap-2 p-2 hover:bg-blue-500/10 rounded-lg text-[11px] text-pplx-text transition-all group border border-transparent hover:border-blue-500/20"
              >
                <Navigation
                  size={12}
                  className="text-blue-400 group-hover:rotate-12 transition-transform"
                />
                <span className="font-medium">Locația curentă</span>
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto p-1.5 no-scrollbar">
              {CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    fetchWeather(city.lat, city.lon, city.name, selectedDate);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 hover:bg-pplx-hover rounded-lg text-[11px] transition-all ${location.name === city.name ? "text-blue-400 bg-blue-500/5 font-bold" : "text-pplx-muted"}`}
                >
                  <span>{city.name}</span>
                  {location.name === city.name && (
                    <div className="w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [prevViewMode, setPrevViewMode] = useState<ViewMode>("month");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>(() =>
    getHolidays(new Date().getFullYear()),
  );
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Update holidays when year changes
  useEffect(() => {
    setHolidays(getHolidays(currentDate.getFullYear()));
  }, [currentDate.getFullYear()]);

  // New Event State
  const [newEventData, setNewEventData] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    allDay: false,
    color: "bg-blue-500",
  });

  // --- Date Helpers ---

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // --- Navigation ---

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // --- Event Handling ---

  const handleCreateClick = (initialDate?: Date) => {
    setSelectedEventId(null);
    const start = initialDate ? new Date(initialDate) : new Date();
    if (!initialDate) start.setHours(9, 0, 0, 0);
    else start.setHours(9, 0, 0, 0); // Ensure consistent start time if just a date is passed

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setNewEventData({
      title: "",
      description: "",
      startDate: start.getTime(),
      endDate: end.getTime(),
      allDay: false,
      color: "bg-blue-500",
    });
    setIsEventModalOpen(true);
  };

  const handleHolidayClick = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsHolidayModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventId(event.id);
    setNewEventData(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!newEventData.title || !newEventData.startDate || !newEventData.endDate)
      return;

    if (selectedEventId) {
      onUpdateEvent(selectedEventId, newEventData);
    } else {
      onAddEvent(newEventData as Omit<CalendarEvent, "id">);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteClick = () => {
    if (selectedEventId) {
      onDeleteEvent(selectedEventId);
      setIsEventModalOpen(false);
    }
  };

  // --- Filtering ---
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [events, searchQuery]);

  // --- Renderers ---

  const renderMiniCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="p-4 bg-pplx-card border border-pplx-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-pplx-text">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() - 1);
                setCurrentDate(d);
              }}
              className="p-1.5 hover:bg-pplx-hover rounded-lg text-pplx-muted hover:text-pplx-text transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() + 1);
                setCurrentDate(d);
              }}
              className="p-1.5 hover:bg-pplx-hover rounded-lg text-pplx-muted hover:text-pplx-text transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-[10px] text-pplx-muted font-bold uppercase tracking-tighter"
            >
              {d.charAt(0)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {[...blanks, ...dayNumbers].map((day, idx) => {
            if (!day) return <div key={`mini-blank-${idx}`} />;
            const date = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day,
            );
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, currentDate);
            const hasEvents = events.some((e) =>
              isSameDay(new Date(e.startDate), date),
            );

            return (
              <button
                key={day}
                onClick={() => setCurrentDate(date)}
                className={`
                                  w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] transition-all
                                  ${isSelected ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20" : isToday ? "bg-blue-600/10 text-blue-500 font-bold" : "text-pplx-muted hover:bg-pplx-hover"}
                              `}
              >
                {day}
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUpcomingEvents = () => {
    const upcoming = events
      .filter((e) => new Date(e.startDate) >= new Date())
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 5);

    return (
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-[10px] font-bold text-pplx-muted uppercase tracking-[0.2em] px-2">
          Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <div className="text-xs text-pplx-muted italic px-2">
            No events scheduled
          </div>
        ) : (
          upcoming.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="flex gap-4 items-center p-3 hover:bg-pplx-hover rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-pplx-border"
            >
              <div
                className={`w-1 h-10 rounded-full shrink-0 ${event.color || "bg-blue-600"} shadow-[0_0_10px_rgba(59,130,246,0.2)]`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-pplx-text truncate group-hover:text-blue-400 transition-colors">
                  {event.title}
                </div>
                <div className="text-[11px] text-pplx-muted font-medium mt-0.5">
                  {new Date(event.startDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {new Date(event.startDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-px bg-pplx-border h-full border-x border-b border-pplx-border rounded-b-3xl md:rounded-2xl overflow-hidden shadow-2xl md:bg-pplx-border md:border">
        {/* Headers */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="bg-pplx-card md:bg-pplx-card p-2 text-center text-[10px] font-black text-pplx-muted uppercase tracking-widest md:border-b md:border-pplx-border"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {[...blanks, ...dayNumbers].map((day, idx) => {
          if (!day)
            return (
              <div
                key={`blank-${idx}`}
                className="bg-pplx-input min-h-[40px] md:min-h-[80px]"
              />
            );

          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
          );
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const isToday = isSameDay(date, new Date());
          const dayEvents = filteredEvents.filter((e) =>
            isSameDay(new Date(e.startDate), date),
          );
          const dayHolidays = holidays.filter((h) => h.date === dateStr);
          const hasPublicHoliday = dayHolidays.some((h) => h.isPublic);

          return (
            <div
              key={day}
              className={`bg-pplx-input p-1.5 min-h-[40px] md:min-h-[80px] hover:bg-pplx-hover/20 transition-colors cursor-pointer group relative flex flex-col gap-1 border-r border-b border-pplx-border last:border-r-0 ${hasPublicHoliday ? "bg-red-500/5" : ""}`}
              onClick={() => {
                setCurrentDate(date);
                // Mobile Logic:
                // - If empty -> Open Add Modal
                // - If has events -> Go to Day View
                if (window.innerWidth < 768) {
                  if (dayEvents.length === 0) {
                    handleCreateClick(date);
                  } else {
                    setViewMode("day");
                  }
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full transition-all ${isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : hasPublicHoliday ? "text-red-400" : "text-pplx-muted group-hover:text-pplx-text"}`}
                  >
                    {day}
                  </span>
                  {dayHolidays.slice(0, 2).map((h, hIdx) => (
                    <span
                      key={hIdx}
                      className={`text-[8px] font-black mt-0.5 text-center leading-tight truncate cursor-help hover:scale-110 transition-transform ${h.isPublic ? "text-red-500" : "text-emerald-500"}`}
                      title={`${h.name} (${h.country})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHolidayClick(h);
                      }}
                    >
                      {h.name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateClick(date);
                  }}
                  className="hidden md:block absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-pplx-hover rounded-full text-pplx-muted hover:text-pplx-text transition-all z-20"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Events List */}
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-0.5">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className={`text-[8px] md:text-[9px] px-1 md:px-1 py-0.5 rounded-md truncate font-bold ${event.color || "bg-blue-600"} text-white shadow-sm hover:brightness-110 hover:shadow-md transition-all border border-pplx-border/10`}
                  >
                    {event.allDay ? (
                      ""
                    ) : (
                      <span className="hidden md:inline opacity-75 mr-1 text-[7px]">
                        {new Date(event.startDate).getHours()}h
                      </span>
                    )}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-full overflow-hidden border border-pplx-border rounded-2xl bg-pplx-card shadow-2xl">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-pplx-border bg-pplx-hover/5">
          <div className="p-2 border-r border-pplx-border flex items-center justify-center">
            <Clock size={14} className="text-pplx-muted opacity-40" />
          </div>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const dayHolidays = holidays.filter((h) => h.date === dateStr);
            const hasPublicHoliday = dayHolidays.some((h) => h.isPublic);
            return (
              <div
                key={i}
                className={`p-3 text-center border-r border-pplx-border last:border-r-0 ${isToday ? "bg-blue-500/5" : hasPublicHoliday ? "bg-red-500/5" : ""}`}
              >
                <div
                  className={`text-[10px] uppercase font-black tracking-[0.2em] mb-1 ${hasPublicHoliday ? "text-red-400" : "text-pplx-muted"}`}
                >
                  {DAYS[day.getDay()]}
                </div>
                <div
                  className={`text-lg font-light ${isToday ? "text-blue-500 font-bold" : hasPublicHoliday ? "text-red-400" : "text-pplx-text"}`}
                >
                  {day.getDate()}
                </div>
                {dayHolidays.map((h, hIdx) => (
                  <div
                    key={hIdx}
                    className={`text-[8px] font-black truncate mt-1 cursor-help hover:text-pplx-text transition-colors ${h.isPublic ? "text-red-500" : "text-emerald-500"}`}
                    title={h.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHolidayClick(h);
                    }}
                  >
                    {h.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className="grid grid-cols-8 min-h-[1000px] bg-pplx-input">
            {/* Time Column */}
            <div className="border-r border-pplx-border bg-pplx-card/50">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-14 border-b border-pplx-border text-[9px] text-pplx-muted p-2 text-right font-bold sticky left-0"
                >
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {weekDays.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="border-r border-pplx-border last:border-r-0 relative group"
              >
                {/* Grid Lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-14 border-b border-pplx-border hover:bg-pplx-hover/20 transition-colors cursor-pointer"
                    onClick={() => {
                      const newDate = new Date(day);
                      newDate.setHours(hour, 0, 0, 0);
                      handleCreateClick(newDate);
                    }}
                  />
                ))}

                {/* Events */}
                {filteredEvents
                  .filter((e) => isSameDay(new Date(e.startDate), day))
                  .map((event) => {
                    const start = new Date(event.startDate);
                    const end = new Date(event.endDate);
                    const startHour =
                      start.getHours() + start.getMinutes() / 60;
                    const duration =
                      (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`absolute left-1 right-1 rounded-lg p-1.5 text-[10px] overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-lg hover:z-20 transition-all shadow-sm z-10 ${event.color || "bg-blue-600"} text-white border border-pplx-border/20 flex flex-col`}
                        style={{
                          top: `${startHour * 56}px`, // 56px per hour (h-14 = 3.5rem = 56px)
                          height: `${Math.max(duration * 56, 28)}px`,
                        }}
                      >
                        <div className="font-bold truncate leading-tight">
                          {event.title}
                        </div>
                        <div className="text-[9px] opacity-80 truncate mt-0.5">
                          {start.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {end.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const day = currentDate;
    const isToday = isSameDay(day, new Date());
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const dayHolidays = holidays.filter((h) => h.date === dateStr);
    const hasPublicHoliday = dayHolidays.some((h) => h.isPublic);

    return (
      <div className="flex flex-col h-full overflow-hidden border border-pplx-border rounded-2xl bg-pplx-card shadow-2xl">
        {/* Header */}
        <div className="border-b border-pplx-border p-6 text-center bg-pplx-hover/5">
          <div
            className={`text-[10px] uppercase font-black tracking-[0.3em] mb-2 ${hasPublicHoliday ? "text-red-400" : "text-pplx-muted"}`}
          >
            {DAYS[day.getDay()]}
          </div>
          <div
            className={`text-4xl font-serif font-bold ${isToday ? "text-blue-500" : hasPublicHoliday ? "text-red-400" : "text-pplx-text"}`}
          >
            {day.getDate()} {MONTHS[day.getMonth()]}
          </div>
          {dayHolidays.map((h, hIdx) => (
            <div
              key={hIdx}
              className={`text-sm font-black mt-3 cursor-help hover:text-pplx-text transition-colors ${h.isPublic ? "text-red-500" : "text-emerald-500"}`}
              title={h.name}
              onClick={(e) => {
                e.stopPropagation();
                handleHolidayClick(h);
              }}
            >
              {h.name}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className="grid grid-cols-[80px_1fr] min-h-[1000px] bg-pplx-input">
            {/* Time Column */}
            <div className="border-r border-pplx-border bg-pplx-card/50">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-20 border-b border-pplx-border text-[10px] text-pplx-muted p-3 text-right font-bold sticky left-0"
                >
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day Column */}
            <div className="relative group">
              {/* Grid Lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-20 border-b border-pplx-border hover:bg-pplx-hover/20 transition-colors cursor-pointer"
                  onClick={() => {
                    const newDate = new Date(day);
                    newDate.setHours(hour, 0, 0, 0);
                    handleCreateClick(newDate);
                  }}
                />
              ))}

              {/* Events */}
              {filteredEvents
                .filter((e) => isSameDay(new Date(e.startDate), day))
                .map((event) => {
                  const start = new Date(event.startDate);
                  const end = new Date(event.endDate);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const duration =
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`absolute left-4 right-4 rounded-xl p-4 text-sm overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-xl hover:z-20 transition-all shadow-md z-10 ${event.color || "bg-blue-600"} text-white border border-pplx-border/20 flex flex-col gap-1`}
                      style={{
                        top: `${startHour * 80}px`, // 80px per hour
                        height: `${Math.max(duration * 80, 40)}px`,
                      }}
                    >
                      <div className="font-bold truncate text-base">
                        {event.title}
                      </div>
                      <div className="text-xs opacity-80 truncate">
                        {start.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {end.toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      {event.location && (
                        <div className="text-[10px] flex items-center gap-1 opacity-70">
                          <MapPin size={10} /> {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...filteredEvents].sort(
      (a, b) => a.startDate - b.startDate,
    );
    const upcomingEvents = sortedEvents.filter(
      (e) =>
        new Date(e.startDate) >=
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
        ),
    );

    // Combine events and holidays for agenda
    const agendaItems = [
      ...upcomingEvents.map((e) => ({
        type: "event" as const,
        date: e.startDate,
        data: e,
      })),
      ...holidays
        .filter(
          (h) =>
            new Date(h.date) >=
            new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
            ),
        )
        .map((h) => ({ type: "holiday" as const, date: h.date, data: h })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="h-full overflow-y-auto no-scrollbar bg-pplx-primary p-4 md:p-6 space-y-4">
        {agendaItems.length === 0 && (
          <div className="text-center text-pplx-muted py-20 flex flex-col items-center">
            <CalendarIcon size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-medium">
              No upcoming events or holidays found
            </p>
          </div>
        )}
        {agendaItems.map((item) => {
          const date = new Date(item.date);

          if (item.type === "event") {
            const event = item.data as CalendarEvent;
            return (
              <div
                key={`event-${event.id}`}
                onClick={() => handleEventClick(event)}
                className="flex items-start gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border border-pplx-border hover:bg-pplx-hover/20 hover:border-blue-500/30 hover:shadow-xl transition-all cursor-pointer group bg-pplx-card/50"
              >
                <div className="flex flex-col items-center min-w-[60px] md:min-w-[70px] bg-pplx-card border border-pplx-border rounded-xl p-2 shadow-lg">
                  <span className="text-[10px] font-bold text-pplx-muted uppercase tracking-wider">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-2xl md:text-3xl font-light text-pplx-text my-1">
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] text-pplx-muted font-medium">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
                <div
                  className={`w-1 self-stretch rounded-full ${event.color || "bg-blue-600"} opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(59,130,246,0.2)]`}
                />
                <div className="flex-1 pt-1">
                  <h3 className="font-serif text-lg md:text-xl font-bold text-pplx-text group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] md:text-xs text-pplx-muted">
                    <span className="flex items-center gap-1.5 bg-pplx-hover/20 px-2 py-1 rounded-lg">
                      <Clock size={12} />
                      {event.allDay
                        ? "All Day"
                        : `${new Date(event.startDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(event.endDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5 bg-pplx-hover/20 px-2 py-1 rounded-lg">
                        <MapPin size={12} /> {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-3 text-xs md:text-sm text-pplx-muted/80 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          } else {
            const holiday = item.data as Holiday;
            return (
              <div
                key={`holiday-${holiday.date}-${holiday.name}`}
                onClick={() => handleHolidayClick(holiday)}
                className={`flex items-start gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border transition-all group cursor-pointer hover:bg-pplx-hover/20 ${holiday.isPublic ? "bg-red-500/5 border-red-500/10" : "bg-emerald-500/5 border-emerald-500/10"}`}
              >
                <div
                  className={`flex flex-col items-center min-w-[60px] md:min-w-[70px] border rounded-xl p-2 shadow-lg ${holiday.isPublic ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${holiday.isPublic ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span
                    className={`text-2xl md:text-3xl font-light my-1 ${holiday.isPublic ? "text-red-500" : "text-emerald-500"}`}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    className={`text-[10px] font-medium ${holiday.isPublic ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
                <div
                  className={`w-1 self-stretch rounded-full ${holiday.isPublic ? "bg-red-500" : "bg-emerald-500"} opacity-80 shadow-[0_0_10px_rgba(239,68,68,0.2)]`}
                />
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-serif text-lg md:text-xl font-bold ${holiday.isPublic ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {holiday.name}
                    </h3>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-pplx-hover/20 text-pplx-muted uppercase tracking-tighter">
                      {holiday.country === "BOTH" ? "RO & DE" : holiday.country}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] md:text-xs text-pplx-muted">
                    <span
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${holiday.isPublic ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                    >
                      <CalendarIcon size={12} />
                      {holiday.isPublic ? "Zi Nelucrătoare" : "Sărbătoare"}
                    </span>
                    <span className="text-pplx-muted/60 italic">
                      System Event
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-y-auto no-scrollbar p-4 bg-pplx-primary">
        {months.map((month) => {
          const date = new Date(year, month, 1);
          const { days, firstDay } = getDaysInMonth(date);
          const blanks = Array(firstDay).fill(null);
          const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

          return (
            <div
              key={month}
              className="bg-pplx-card p-4 rounded-2xl border border-pplx-border hover:border-blue-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
              onClick={() => {
                setCurrentDate(date);
                setViewMode("month");
              }}
            >
              <h3 className="text-xs font-bold text-pplx-text mb-3 uppercase tracking-widest border-b border-pplx-border pb-2">
                {MONTHS[month]}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-[8px] text-pplx-muted font-bold mb-1"
                  >
                    {d}
                  </div>
                ))}
                {[...blanks, ...dayNumbers].map((day, idx) => {
                  const isToday =
                    day && isSameDay(new Date(year, month, day), new Date());
                  return (
                    <div
                      key={idx}
                      className={`text-[9px] h-5 flex items-center justify-center rounded-full transition-colors ${day ? "text-pplx-text" : ""} ${isToday ? "bg-blue-500 text-white font-bold" : "hover:bg-pplx-hover/30"}`}
                    >
                      {day || ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleToggleAgenda = () => {
    if (viewMode === "agenda") {
      setViewMode(prevViewMode || "month");
    } else {
      setPrevViewMode(viewMode);
      setViewMode("agenda");
    }
  };

  const todayHoliday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return holidays.find((h) => h.date === todayStr);
  }, [holidays]);

  return (
    <div className="flex flex-col h-full w-full bg-pplx-primary p-0 md:p-2 gap-0 overflow-hidden">
      {/* Holiday Banner */}
      {todayHoliday && (
        <div
          onClick={() => handleHolidayClick(todayHoliday)}
          className={`px-4 py-2 flex items-center justify-between text-[11px] font-bold cursor-pointer hover:brightness-125 transition-all ${todayHoliday.isPublic ? "bg-red-600/20 text-red-400 border-b border-red-600/30" : "bg-emerald-600/20 text-emerald-400 border-b border-emerald-600/30"}`}
        >
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>
              Astăzi: {todayHoliday.name} ({todayHoliday.country}){" "}
              {todayHoliday.isPublic ? "— Zi Nelucrătoare" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-[9px] uppercase tracking-widest">
              Sărbătoare de Sistem
            </span>
          </div>
        </div>
      )}

      {/* Header Bar - Translucent, sticky */}
      <div className="sticky top-0 z-20 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 shrink-0 bg-pplx-primary/80 backdrop-blur-md px-4 py-2 md:py-2 border-b border-pplx-border">
        {/* Top Row (Desktop: Icon, Title | Mobile: Weather & Date) */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          {/* Desktop: Weather Widget (Replacing Title) */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="bg-pplx-card border border-pplx-border rounded-2xl px-3 py-1.5 shadow-sm">
              <WeatherWidget selectedDate={currentDate} />
            </div>
          </div>

          {/* Mobile: Weather Widget & Month/Year Navigation */}
          <div className="flex md:hidden items-center justify-between w-full">
            {/* Weather Widget */}
            <div className="bg-pplx-card border border-pplx-border rounded-xl px-2 py-1 shadow-sm">
              <WeatherWidget selectedDate={currentDate} />
            </div>

            {/* Month/Year & Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-pplx-hover rounded-xl text-pplx-muted active:scale-90 transition-all border border-transparent hover:border-pplx-border"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xl font-black text-pplx-text tracking-tighter min-w-[100px] text-center">
                {MONTHS[currentDate.getMonth()].substring(0, 3)}{" "}
                {currentDate.getFullYear()}
              </span>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-pplx-hover rounded-xl text-pplx-muted active:scale-90 transition-all border border-transparent hover:border-pplx-border"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 shrink-0 bg-pplx-card border border-pplx-border rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-pplx-hover rounded-xl text-pplx-muted hover:text-pplx-text transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-pplx-text mx-2 min-w-[140px] text-center">
              {viewMode === "year"
                ? currentDate.getFullYear()
                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-pplx-hover rounded-xl text-pplx-muted hover:text-pplx-text transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden md:block flex-1 max-w-md w-full relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-pplx-muted group-focus-within:text-blue-500 transition-colors"
            size={14}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-pplx-input border border-pplx-border rounded-2xl pl-10 pr-4 py-2 text-xs text-pplx-text focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm placeholder:text-pplx-muted/50"
          />
        </div>

        {/* Right: Switcher & View Selector & New Event (Desktop) */}
        <div className="hidden md:flex items-center gap-3 justify-end">
          {/* Agenda/Calendar Switcher */}
          <div className="flex bg-pplx-input border border-pplx-border rounded-2xl p-1 shrink-0 shadow-sm">
            <button
              onClick={() => viewMode === "agenda" && handleToggleAgenda()}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode !== "agenda" ? "bg-pplx-card text-pplx-text shadow-md" : "text-pplx-muted hover:text-pplx-text"}`}
            >
              Calendar
            </button>
            <button
              onClick={() => viewMode !== "agenda" && handleToggleAgenda()}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "agenda" ? "bg-pplx-card text-pplx-text shadow-md" : "text-pplx-muted hover:text-pplx-text"}`}
            >
              Agenda
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-pplx-card border border-pplx-border rounded-2xl text-xs font-bold text-pplx-text hover:bg-pplx-hover transition-all min-w-[110px] justify-between shadow-sm active:scale-95"
            >
              <span className="capitalize">
                {viewMode === "agenda" ? prevViewMode : viewMode}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${isViewMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isViewMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-pplx-card border border-pplx-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1">
                {(["year", "month", "week", "day"] as ViewMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode);
                        setPrevViewMode(mode);
                        setIsViewMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs capitalize rounded-xl hover:bg-pplx-hover transition-colors flex items-center justify-between ${viewMode === mode ? "text-blue-500 font-bold bg-blue-500/5" : "text-pplx-muted"}`}
                    >
                      {mode}
                      {viewMode === mode && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => handleCreateClick()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95"
          >
            <Plus size={18} /> <span>Create</span>
          </button>
        </div>

        {/* Mobile: Control Bar */}
        <div className="flex md:hidden items-center justify-between w-full gap-2 mt-1">
          {/* Agenda/Calendar Switcher */}
          <div className="flex flex-1 bg-pplx-input border border-pplx-border rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => viewMode === "agenda" && handleToggleAgenda()}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${viewMode !== "agenda" ? "bg-pplx-card text-pplx-text shadow-md" : "text-pplx-muted hover:text-pplx-text"}`}
            >
              Calendar
            </button>
            <button
              onClick={() => viewMode !== "agenda" && handleToggleAgenda()}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${viewMode === "agenda" ? "bg-pplx-card text-pplx-text shadow-md" : "text-pplx-muted hover:text-pplx-text"}`}
            >
              Agendă
            </button>
          </div>

          {/* View Selector */}
          <div className="relative">
            <button
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-pplx-card border border-pplx-border rounded-2xl text-[10px] font-bold text-pplx-text shadow-sm"
            >
              <span className="capitalize">
                {viewMode === "agenda" ? prevViewMode : viewMode}
              </span>
              <ChevronDown size={12} />
            </button>
            {isViewMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-pplx-card border border-pplx-border rounded-2xl shadow-2xl z-50 overflow-hidden p-1">
                {(["year", "month", "week", "day"] as ViewMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode);
                        setPrevViewMode(mode);
                        setIsViewMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[10px] capitalize rounded-xl hover:bg-pplx-hover text-pplx-muted"
                    >
                      {mode}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex items-center justify-center w-10 h-10 bg-pplx-card border border-pplx-border rounded-2xl text-pplx-muted hover:text-pplx-text active:scale-95 transition-all shadow-sm"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 md:gap-4 overflow-hidden px-0 md:px-2 pb-2 relative">
        {/* Calendar Grid - Darker background */}
        <div className="flex-[0.6] md:flex-1 h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150 px-4 md:px-0">
          {viewMode === "year" && renderYearView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
          {viewMode === "agenda" && renderAgendaView()}
        </div>

        {/* Mobile Upcoming List (Bottom 40%) */}
        <div className="flex-[0.4] md:hidden overflow-y-auto no-scrollbar rounded-3xl p-4 mx-4 mb-2">
          {renderUpcomingEvents()}
        </div>

        {/* Mobile Bottom Actions (Search & Plus) - REMOVED */}
        {/* <div className="md:hidden absolute bottom-6 right-6 flex items-center gap-3 pointer-events-none z-[60]"> ... </div> */}

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div
            className={`fixed inset-0 z-[110] bg-pplx-primary flex flex-col animate-in fade-in duration-150`}
          >
            <div className="p-4 border-b border-pplx-border bg-pplx-card/50 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-pplx-muted"
                    size={18}
                  />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full bg-pplx-input border border-pplx-border rounded-2xl pl-12 pr-4 py-3 text-base text-pplx-text outline-none focus:border-blue-500/50 shadow-inner"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-pplx-muted hover:text-pplx-text p-2 hover:bg-pplx-hover rounded-xl transition-all"
                >
                  <X size={28} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center text-pplx-muted py-20 flex flex-col items-center opacity-40">
                  <Search size={48} className="mb-4" />
                  <p className="text-lg font-medium">No events found</p>
                  <p className="text-sm">Try searching for something else</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        handleEventClick(event);
                        setIsMobileSearchOpen(false);
                      }}
                      className="p-5 bg-pplx-card rounded-3xl border border-pplx-border shadow-sm active:scale-[0.98] transition-all flex items-center gap-4"
                    >
                      <div
                        className={`w-1.5 h-12 rounded-full ${event.color || "bg-blue-600"} shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-pplx-text text-lg truncate">
                          {event.title}
                        </div>
                        <div className="text-sm text-pplx-muted mt-1 flex items-center gap-2">
                          <CalendarIcon size={14} />
                          {new Date(event.startDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                          <span className="opacity-30">•</span>
                          <Clock size={14} />
                          {new Date(event.startDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-pplx-muted/30" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Sidebar (Desktop Only) - Lighter background */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 gap-4 animate-in fade-in slide-in-from-right-4 duration-150 delay-200 overflow-hidden">
          <div className="bg-pplx-card rounded-2xl p-0.5 shrink-0 border border-pplx-border shadow-2xl">
            {renderMiniCalendar()}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-end pb-2">
            <div className="mt-auto">{renderUpcomingEvents()}</div>
          </div>
        </div>
      </div>

      {/* Holiday Detail Modal */}
      {isHolidayModalOpen && selectedHoliday && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-pplx-card border border-pplx-border rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div
              className={`h-32 relative flex items-end p-8 ${selectedHoliday.isPublic ? "bg-gradient-to-br from-red-500/40 to-red-900/60" : "bg-gradient-to-br from-emerald-500/40 to-emerald-900/60"}`}
            >
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-pplx-hover/20 hover:bg-pplx-hover/40 text-white rounded-full transition-all border border-pplx-border/20"
              >
                <X size={18} />
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-pplx-hover/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm border border-pplx-border/20">
                    {selectedHoliday.country === "BOTH"
                      ? "RO & DE"
                      : selectedHoliday.country === "INT"
                        ? "INT"
                        : selectedHoliday.country}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight drop-shadow-md">
                  {selectedHoliday.name}
                </h2>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-pplx-hover/20 border border-pplx-border rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black text-pplx-muted uppercase tracking-tighter">
                    {new Date(selectedHoliday.date).toLocaleDateString(
                      "ro-RO",
                      { month: "short" },
                    )}
                  </span>
                  <span className="text-xl font-light text-pplx-text">
                    {new Date(selectedHoliday.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-pplx-muted uppercase tracking-[0.2em] mb-1">
                    Data
                  </div>
                  <div className="text-pplx-text text-base font-medium">
                    {new Date(selectedHoliday.date).toLocaleDateString(
                      "ro-RO",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-black text-pplx-muted uppercase tracking-[0.2em]">
                  Descriere
                </div>
                <p className="text-pplx-muted leading-relaxed text-sm font-light italic bg-pplx-hover/5 p-4 rounded-2xl border border-pplx-border/50">
                  {selectedHoliday.description ||
                    "Informații detaliate despre această sărbătoare vor fi disponibile în curând."}
                </p>
              </div>

              <div className="pt-6 border-t border-pplx-border flex justify-between items-center">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-pplx-hover/10 rounded-full border border-pplx-border/50">
                  <div
                    className={`w-2 h-2 rounded-full shadow-sm ${selectedHoliday.type === "religious" ? "bg-emerald-500 shadow-emerald-500/40" : selectedHoliday.type === "national" ? "bg-blue-500 shadow-blue-500/40" : "bg-purple-500 shadow-purple-500/40"}`}
                  />
                  <span className="text-[10px] font-bold text-pplx-muted uppercase tracking-wider">
                    {selectedHoliday.type === "religious"
                      ? "Religios"
                      : selectedHoliday.type === "national"
                        ? "Național"
                        : "Cultural"}
                  </span>
                </div>
                <button
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-6 py-2.5 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-2 md:p-4">
          <div className="bg-pplx-card border border-pplx-border rounded-[32px] shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 md:p-6 border-b border-pplx-border flex justify-between items-center bg-pplx-hover/5 shrink-0">
              <h3 className="font-serif font-bold text-xl md:text-2xl text-pplx-text">
                {selectedEventId ? "Edit Event" : "New Event"}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-pplx-muted hover:text-pplx-text p-2.5 hover:bg-pplx-hover rounded-full transition-all border border-transparent hover:border-pplx-border"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-6 md:space-y-8">
              <div>
                <label className="block text-[10px] font-black text-pplx-muted uppercase mb-3 tracking-[0.2em]">
                  Title
                </label>
                <input
                  type="text"
                  value={newEventData.title}
                  onChange={(e) =>
                    setNewEventData({ ...newEventData, title: e.target.value })
                  }
                  className="w-full bg-pplx-input border border-pplx-border rounded-2xl px-5 py-3.5 md:py-4 text-pplx-text font-medium focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-inner placeholder:text-pplx-muted/30 text-lg"
                  placeholder="What's happening?"
                  autoFocus
                />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-pplx-muted uppercase tracking-[0.2em]">
                      Start Date & Time
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          new Date(newEventData.startDate!)
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) => {
                          const d = new Date(newEventData.startDate!);
                          const [y, m, day] = e.target.value
                            .split("-")
                            .map(Number);
                          d.setFullYear(y, m - 1, day);
                          const newStart = d.getTime();
                          let newEnd = newEventData.endDate!;
                          if (newEnd <= newStart) newEnd = newStart + 3600000;
                          setNewEventData({
                            ...newEventData,
                            startDate: newStart,
                            endDate: newEnd,
                          });
                        }}
                        className="flex-1 bg-pplx-input border border-pplx-border rounded-xl px-4 py-3 text-xs text-pplx-text font-medium outline-none focus:border-blue-500/50 transition-all"
                      />
                      <input
                        type="time"
                        value={new Date(newEventData.startDate!)
                          .toTimeString()
                          .slice(0, 5)}
                        onChange={(e) => {
                          const d = new Date(newEventData.startDate!);
                          const [h, min] = e.target.value
                            .split(":")
                            .map(Number);
                          d.setHours(h, min, 0, 0);
                          const newStart = d.getTime();
                          let newEnd = newEventData.endDate!;
                          if (newEnd <= newStart) newEnd = newStart + 3600000;
                          setNewEventData({
                            ...newEventData,
                            startDate: newStart,
                            endDate: newEnd,
                          });
                        }}
                        className="w-28 bg-pplx-input border border-pplx-border rounded-xl px-3 py-3 text-xs text-pplx-text font-medium outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-pplx-muted uppercase tracking-[0.2em]">
                      End Date & Time
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={
                          new Date(newEventData.endDate!)
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) => {
                          const d = new Date(newEventData.endDate!);
                          const [y, m, day] = e.target.value
                            .split("-")
                            .map(Number);
                          d.setFullYear(y, m - 1, day);
                          setNewEventData({
                            ...newEventData,
                            endDate: d.getTime(),
                          });
                        }}
                        className="flex-1 bg-pplx-input border border-pplx-border rounded-xl px-4 py-3 text-xs text-pplx-text font-medium outline-none focus:border-blue-500/50 transition-all"
                      />
                      <input
                        type="time"
                        value={new Date(newEventData.endDate!)
                          .toTimeString()
                          .slice(0, 5)}
                        onChange={(e) => {
                          const d = new Date(newEventData.endDate!);
                          const [h, min] = e.target.value
                            .split(":")
                            .map(Number);
                          d.setHours(h, min, 0, 0);
                          setNewEventData({
                            ...newEventData,
                            endDate: d.getTime(),
                          });
                        }}
                        className="w-28 bg-pplx-input border border-pplx-border rounded-xl px-3 py-3 text-xs text-pplx-text font-medium outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-pplx-hover/5 p-4 md:p-5 rounded-2xl border border-pplx-border/50">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEventData.allDay}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      allDay: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-pplx-border bg-pplx-input text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
                <label
                  htmlFor="allDay"
                  className="text-sm font-black text-pplx-text/80 cursor-pointer select-none uppercase tracking-wider"
                >
                  All Day Event
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-black text-pplx-muted uppercase mb-3 tracking-[0.2em]">
                  Location
                </label>
                <div className="relative group">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-3.5 md:top-4 text-pplx-muted/40 group-focus-within:text-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    value={newEventData.location || ""}
                    onChange={(e) =>
                      setNewEventData({
                        ...newEventData,
                        location: e.target.value,
                      })
                    }
                    className="w-full bg-pplx-input border border-pplx-border rounded-2xl pl-12 pr-5 py-3.5 md:py-4 text-sm text-pplx-text font-medium outline-none focus:border-blue-500/50 transition-all"
                    placeholder="Add location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-pplx-muted uppercase mb-3 tracking-[0.2em]">
                  Description
                </label>
                <textarea
                  value={newEventData.description || ""}
                  onChange={(e) =>
                    setNewEventData({
                      ...newEventData,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-pplx-input border border-pplx-border rounded-2xl px-5 py-4 md:py-5 text-sm text-pplx-text/90 font-light outline-none min-h-[100px] md:min-h-[120px] focus:border-blue-500/50 transition-all resize-none placeholder:text-pplx-muted/30 leading-relaxed"
                  placeholder="Add details..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-pplx-muted uppercase mb-4 tracking-[0.2em]">
                  Color
                </label>
                <div className="flex flex-wrap gap-4 justify-center bg-pplx-hover/5 p-5 md:p-6 rounded-3xl border border-pplx-border/50">
                  {[
                    "bg-blue-600",
                    "bg-red-600",
                    "bg-emerald-600",
                    "bg-amber-600",
                    "bg-purple-600",
                    "bg-pink-600",
                    "bg-gray-600",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setNewEventData({ ...newEventData, color })
                      }
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${color} transition-all hover:scale-110 shadow-lg ${newEventData.color === color ? "ring-2 ring-offset-4 ring-blue-500 ring-offset-pplx-card scale-110" : "opacity-30 hover:opacity-100"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 md:p-6 border-t border-pplx-border bg-pplx-hover/5 flex justify-between items-center shrink-0">
              {selectedEventId ? (
                <button
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:text-red-600 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={16} /> Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3 md:gap-4">
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-5 md:px-6 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-pplx-muted hover:text-pplx-text hover:bg-pplx-hover rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-6 md:px-10 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95"
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
