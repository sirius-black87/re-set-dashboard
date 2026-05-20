// Inline editable text / number / select components.
// Click the field → it turns into an input. Blur or Enter saves. Esc cancels.
// All edits flow through useTaskStore().setEdit(path, value).

const { useState: useStateE, useRef: useRefE, useEffect: useEffectE } = React;

// ─── Editable ─────────────────────────────────────────────────────────────
//   path        : edit-path string (e.g. 'task.5:2.t')
//   value       : current value
//   multiline   : true → textarea
//   placeholder : empty-value placeholder
//   format      : optional formatter for display (value → string)
//   parse       : optional parser when saving (raw string → stored value)
//   className   : extra classes on the wrapper
//   inputStyle  : style applied to the input/textarea
//   numeric     : numeric input
// ──────────────────────────────────────────────────────────────────────────
function Editable({ path, value, multiline = false, placeholder = '—', format, parse, className = '', as = 'span', style, inputStyle, numeric = false, minWidth = 40, title }) {
  const store = window.useTaskStore();
  const editMode = store && store.editMode;
  const [editing, setEditing] = useStateE(false);
  const [draft, setDraft] = useStateE(value);
  const ref = useRefE(null);

  useEffectE(() => { if (editing) { ref.current && ref.current.focus(); ref.current && ref.current.select && ref.current.select(); } }, [editing]);

  // ---- READ-ONLY when edit mode is off ----
  if (!editMode) {
    const Tag = as;
    const display = (value === undefined || value === null || value === '')
      ? <span className="edit-placeholder-ro">{placeholder}</span>
      : (format ? format(value) : value);
    return <Tag className={className} style={style}>{display}</Tag>;
  }

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    const v = parse ? parse(draft) : (numeric ? Number(draft) : draft);
    if (v !== value) store.setEdit(path, v);
    setEditing(false);
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    const InputTag = multiline ? 'textarea' : 'input';
    return (
      <InputTag
        ref={ref}
        className={'edit-input ' + (multiline ? 'edit-input-multi ' : '') + className}
        type={numeric ? 'number' : 'text'}
        value={draft === undefined || draft === null ? '' : draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          else if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
          else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); }
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ minWidth, ...inputStyle }}
        rows={multiline ? 2 : undefined}
      />
    );
  }

  const Tag = as;
  const display = (value === undefined || value === null || value === '')
    ? <span className="edit-placeholder">{placeholder}</span>
    : (format ? format(value) : value);

  return (
    <Tag
      className={'editable ' + className}
      onClick={startEdit}
      style={style}
      title={title || 'לחץ לעריכה'}
    >
      {display}
    </Tag>
  );
}

// ─── EditableSelect ───────────────────────────────────────────────────────
function EditableSelect({ path, value, options, className = '', style, labelMap, title }) {
  const store = window.useTaskStore();
  const editMode = store && store.editMode;
  const [editing, setEditing] = useStateE(false);
  const ref = useRefE(null);

  useEffectE(() => { if (editing) ref.current && ref.current.focus(); }, [editing]);

  if (!editMode) {
    return <span className={className} style={style}>{labelMap ? (labelMap[value] || value) : value}</span>;
  }

  if (editing) {
    return (
      <select
        ref={ref}
        className={'edit-select ' + className}
        value={value}
        onChange={(e) => { store.setEdit(path, e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        onClick={(e) => e.stopPropagation()}
        style={style}
      >
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.value;
          const l = typeof o === 'string' ? (labelMap ? labelMap[o] || o : o) : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  }

  return (
    <span
      className={'editable editable-select ' + className}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      style={style}
      title={title || 'לחץ לעריכה'}
    >
      {labelMap ? (labelMap[value] || value) : value}
    </span>
  );
}

// ─── DeleteBtn ─────────────────────────────────────────────────────────────
function DeleteBtn({ onDelete, confirmText = 'למחוק?', className = '', size = 14, title = 'מחק' }) {
  const store = window.useTaskStore();
  if (!store || !store.editMode) return null;
  return (
    <button
      type="button"
      className={'delete-btn ' + className}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        if (confirm(confirmText)) onDelete();
      }}
    >
      <Icon name="x" size={size}/>
    </button>
  );
}

window.Editable = Editable;
window.EditableSelect = EditableSelect;
window.DeleteBtn = DeleteBtn;
