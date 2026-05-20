// Icon set — small inline SVGs, lucide-style
const Icon = ({ name, size = 16, ...props }) => {
  const stroke = "currentColor";
  const sw = 1.75;
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke, strokeWidth: sw,
    strokeLinecap: "round", strokeLinejoin: "round",
    ...props
  };
  switch (name) {
    case 'menu': return <svg {...common}><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>;
    case 'home': return <svg {...common}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>;
    case 'gantt': return <svg {...common}><rect x="3" y="5" width="10" height="3" rx="1"/><rect x="7" y="11" width="10" height="3" rx="1"/><rect x="11" y="17" width="10" height="3" rx="1"/></svg>;
    case 'list': return <svg {...common}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>;
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'wallet': return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h14v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 7v0a2 2 0 0 1 2-2h12"/><circle cx="16" cy="13" r="1.2"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/></svg>;
    case 'users': return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14c2.5 0 5 1.7 5 5"/></svg>;
    case 'heart': return <svg {...common}><path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 19 10c0 5.5-7 10-7 10Z"/></svg>;
    case 'scale': return <svg {...common}><path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-2 6c0 1.5 1 2.5 2 2.5s2-1 2-2.5l-2-6Z"/><path d="M19 7l-2 6c0 1.5 1 2.5 2 2.5s2-1 2-2.5l-2-6Z"/></svg>;
    case 'user-plus': return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><line x1="18" y1="8" x2="18" y2="14"/><line x1="15" y1="11" x2="21" y2="11"/></svg>;
    case 'activity': return <svg {...common}><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
    case 'stethoscope': return <svg {...common}><path d="M5 4v6a4 4 0 0 0 8 0V4"/><path d="M5 4h2M11 4h2"/><path d="M9 14v2a4 4 0 0 0 8 0v-2"/><circle cx="17" cy="10" r="2"/></svg>;
    case 'flag': return <svg {...common}><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>;
    case 'alert': return <svg {...common}><path d="M12 3l10 18H2L12 3Z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.5" r="0.5"/></svg>;
    case 'check': return <svg {...common} strokeWidth="2.5"><polyline points="5 12 10 17 19 7"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'moon': return <svg {...common}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/></svg>;
    case 'sparkles': return <svg {...common}><path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z"/><path d="M19 4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>;
    case 'arrow-left': return <svg {...common}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
    case 'arrow-right': return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'chevron-down': return <svg {...common}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'chevron-up': return <svg {...common}><polyline points="6 15 12 9 18 15"/></svg>;
    case 'plus': return <svg {...common} strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'x': return <svg {...common} strokeWidth="2.4"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>;
    case 'trash': return <svg {...common}><polyline points="4 7 20 7"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>;
    case 'pencil': return <svg {...common}><path d="M14 4l6 6L8 22H2v-6L14 4Z"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

window.Icon = Icon;
