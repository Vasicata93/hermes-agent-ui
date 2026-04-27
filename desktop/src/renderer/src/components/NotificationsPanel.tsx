import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CalendarIcon, CheckCircle2, MessageSquare, AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "calendar" | "task" | "message" | "system";
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Calendar Event",
    message: "Team Standup starting in 5 minutes",
    time: "5m ago",
    type: "calendar",
    isRead: false,
  },
  {
    id: "2",
    title: "Task Completed",
    message: "Design new dashboard layout",
    time: "1h ago",
    type: "task",
    isRead: false,
  },
  {
    id: "3",
    title: "New Message",
    message: "Alice replied to your note.",
    time: "3h ago",
    type: "message",
    isRead: true,
  },
  {
    id: "4",
    title: "System Update",
    message: "Applet successfully updated to v2.0",
    time: "1d ago",
    type: "system",
    isRead: true,
  },
];

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile, invisible on desktop but captures clicks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-auto"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-12 right-2 w-80 max-w-[calc(100vw-1rem)] z-[60] bg-pplx-primary border border-pplx-border shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col cursor-default"
            style={{ maxHeight: "calc(100vh - 5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="font-display font-medium text-pplx-text flex items-center gap-2 text-sm">
                <Bell size={16} className="text-pplx-muted" />
                Notifications
              </h3>
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-pplx-muted hover:bg-pplx-hover hover:text-pplx-text transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar">
              <div className="flex flex-col">
                {mockNotifications.map((notif) => {
                  let Icon = Bell;
                  switch(notif.type) {
                    case "calendar": Icon = CalendarIcon; break;
                    case "task": Icon = CheckCircle2; break;
                    case "message": Icon = MessageSquare; break;
                    case "system": Icon = AlertCircle; break;
                  }

                  return (
                    <div 
                      key={notif.id}
                      className={`relative flex items-start gap-3 p-3 mx-2 my-1 rounded-xl hover:bg-pplx-hover/50 transition-colors cursor-pointer ${!notif.isRead ? "bg-pplx-accent/5 hover:bg-pplx-accent/10" : ""}`}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pplx-accent" />
                      )}
                      
                      <div className={`mt-0.5 p-2 rounded-xl bg-pplx-secondary/20 shrink-0 text-pplx-muted`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <h4 className={`text-sm tracking-tight truncate ${!notif.isRead ? "font-semibold text-pplx-text" : "font-medium text-pplx-text/90"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-pplx-muted whitespace-nowrap shrink-0 mt-0.5">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-pplx-muted line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-3">
                <button className="w-full text-xs font-medium text-pplx-accent py-2 rounded-xl hover:bg-pplx-accent/10 transition-colors">
                    Mark all as read
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
