import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Separator } from "@/components/ui/separator";

// --- MOCK UI COMPONENTS ---
const Button = React.forwardRef(({ children, variant, ...props }, ref) => (
  <button
    ref={ref}
    className={`px-4 py-2 rounded-lg font-semibold text-white ${
      variant === "destructive"
        ? "bg-red-500 hover:bg-red-600"
        : "bg-slate-900 hover:bg-slate-700"
    } focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 transition-colors`}
    {...props}
  >
    {children}
  </button>
));
Button.displayName = "Button";

const Image = React.forwardRef(({ src, alt, ...props }, ref) => (
  <img
    ref={ref}
    className="w-full rounded-lg shadow-sm"
    src={src}
    alt={alt}
    {...props}
  />
));
Image.displayName = "Image";

const Input = React.forwardRef((props, ref) => (
  <input
    ref={ref}
    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef((props, ref) => (
  <textarea
    ref={ref}
    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Text = React.forwardRef(({ text, ...props }, ref) => (
  <p ref={ref} className="text-base text-slate-800" style={{ ...props.style }}>
    {text}
  </p>
));
Text.displayName = "Text";

const Description = React.forwardRef(({ text, ...props }, ref) => (
  <p ref={ref} className="text-sm text-slate-600" style={{ ...props.style }}>
    {text}
  </p>
));
Description.displayName = "Description";

const Graph = React.forwardRef(({ chartType, ...props }, ref) => (
  <div ref={ref} className="w-full h-64 bg-slate-50 p-4 rounded-lg">
    <p className="text-center font-medium text-slate-700 mb-2">
      {chartType === "bar" ? "Bar Chart" : "Line Chart"}
    </p>
    <svg
      className="w-full h-full"
      viewBox="0 0 100 50"
      preserveAspectRatio="none"
    >
      {chartType === "bar" ? (
        <>
          <rect x="10" y="20" width="15" height="30" fill="#a7f3d0" />
          <rect x="35" y="10" width="15" height="40" fill="#6ee7b7" />
          <rect x="60" y="25" width="15" height="25" fill="#34d399" />
          <rect x="85" y="5" width="15" height="45" fill="#10b981" />
        </>
      ) : (
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points="5,45 25,20 45,35 65,10 85,25 95,5"
        />
      )}
    </svg>
  </div>
));
Graph.displayName = "Graph";

const EditableCell = ({ value, onSave, isHeader = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef(null);
  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      setText(value);
      setIsEditing(false);
    }
  };
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag
      className="border border-slate-300 px-2 py-1 relative"
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-1 box-border absolute inset-0 outline-none border-2 border-blue-500 z-10"
        />
      ) : (
        <span className="block min-h-[24px]">{value}</span>
      )}
    </CellTag>
  );
};

const Table = React.forwardRef(
  ({ data, hasHeader, onDataChange, ...props }, ref) => {
    if (!data) return <div>Table data is missing.</div>;
    const handleHeaderSave = (colIndex, newValue) => {
      const newHeaders = [...data.headers];
      newHeaders[colIndex] = newValue;
      onDataChange({ ...data, headers: newHeaders });
    };
    const handleCellSave = (rowIndex, colIndex, newValue) => {
      const newCells = data.cells.map((row) => [...row]);
      newCells[rowIndex][colIndex] = newValue;
      onDataChange({ ...data, cells: newCells });
    };
    return (
      <table
        ref={ref}
        className="w-full border-collapse border border-slate-400"
        {...props}
      >
        {hasHeader && data.headers && (
          <thead>
            <tr>
              {data.headers.map((headerText, colIndex) => (
                <EditableCell
                  key={colIndex}
                  value={headerText}
                  onSave={(newValue) => handleHeaderSave(colIndex, newValue)}
                  isHeader
                />
              ))}
            </tr>
          </thead>
        )}
        {data.cells && (
          <tbody>
            {data.cells.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cellText, colIndex) => (
                  <EditableCell
                    key={colIndex}
                    value={cellText}
                    onSave={(newValue) =>
                      handleCellSave(rowIndex, colIndex, newValue)
                    }
                  />
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    );
  },
);
Table.displayName = "Table";

// --- COMPONENT INFRASTRUCTURE ---
const COMPONENT_MAP = { Text, Description, Image, Table };

const generateDefaultTableData = (rows, cols, hasHeader) => {
  const actualRows = hasHeader ? rows - 1 : rows;
  return {
    headers: Array.from({ length: cols }, (_, i) => `Header ${i + 1}`),
    cells: Array.from({ length: actualRows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => `Cell ${r + 1}-${c + 1}`),
    ),
  };
};

const DEFAULT_PROPS = {
  Button: {
    text: "Click Me",
    variant: "default",
    styles: {
      marginTop: 0,
      marginBottom: 8,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#FFFFFF",
    },
  },
  Input: {
    label: "Field Label",
    placeholder: "Enter value...",
    styles: {
      marginTop: 10,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#334155",
    },
  },
  Textarea: {
    label: "Message",
    placeholder: "Your message here",
    styles: {
      marginTop: 10,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#334155",
    },
  },
  Separator: {
    styles: { marginTop: 10, marginBottom: 4, marginLeft: 0, marginRight: 0 },
  },
  Image: {
    src: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    alt: "A placeholder image",
    styles: { marginTop: 10, marginBottom: 4, marginLeft: 0, marginRight: 0 },
  },
  Table: {
    rows: 4,
    cols: 4,
    hasHeader: true,
    data: generateDefaultTableData(4, 4, true),
    styles: { marginTop: 10, marginBottom: 4, marginLeft: 0, marginRight: 0 },
  },
  Text: {
    text: "This is an editable text block. Click to select and edit in the properties panel.",
    styles: {
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 18,
      color: "#1e293b",
    },
  },
  Description: {
    text: "This is a smaller description text. Use it for details, captions, or supplementary information.",
    styles: {
      marginTop: 4,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#475569",
    },
  },
  Graph: {
    chartType: "bar",
    styles: { marginTop: 10, marginBottom: 4, marginLeft: 0, marginRight: 0 },
  },
};

// --- Draggable UI Components ---
const DraggableSidebarItem = ({ id }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform) }}
      {...attributes}
      {...listeners}
      className="p-2"
    >
      <div className="bg-white p-4 rounded-lg border border-slate-200 cursor-grab shadow-sm hover:shadow-md transition-shadow text-center">
        <p className="font-medium text-slate-700">{id}</p>
      </div>
    </div>
  );
};

const SortableCanvasItem = ({
  id,
  component,
  onSelect,
  isSelected,
  onUpdate,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const { styles, ...props } = component.props;
  const [isDragOver, setIsDragOver] = useState(false);
  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginTop: `${styles.marginTop}px`,
    marginBottom: `${styles.marginBottom}px`,
    marginLeft: `${styles.marginLeft}px`,
    marginRight: `${styles.marginRight}px`,
    position: "relative",
  };
  const selectionClasses = isSelected
    ? "ring-2 ring-blue-500 ring-offset-2"
    : "hover:ring-2 hover:ring-blue-300";
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const newSrc = URL.createObjectURL(file);
      if (props.src && props.src.startsWith("blob:")) {
        URL.revokeObjectURL(props.src);
      }
      onUpdate(id, { ...props, src: newSrc });
    }
  };
  const dragHandlers =
    component.type === "Image"
      ? {
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
        }
      : {};
  const renderComponent = () => {
    const Component = COMPONENT_MAP[component.type];
    if (!Component) return <div>Unknown Component</div>;
    const componentProps = {
      ...props,
      style: { color: styles.color, fontSize: `${styles.fontSize}px` },
    };
    switch (component.type) {
      case "Table":
        return (
          <Table
            data={props.data}
            hasHeader={props.hasHeader}
            onDataChange={(newTableData) =>
              onUpdate(id, { ...component.props, data: newTableData })
            }
          />
        );
      case "Input":
        return (
          <div className="w-full space-y-2">
            <label className="font-medium text-sm">{props.label}</label>
            <Input placeholder={props.placeholder} readOnly />
          </div>
        );
      case "Textarea":
        return (
          <div className="w-full space-y-2">
            <label className="font-medium text-sm">{props.label}</label>
            <Textarea placeholder={props.placeholder} readOnly />
          </div>
        );
      case "Button":
        return <Button variant={props.variant}>{props.text}</Button>;
      case "Separator":
        return <Separator />;
      case "Image":
        return <Image src={props.src} alt={props.alt} />;
      case "Text":
        return <Text text={props.text} style={componentProps.style} />;
      case "Description":
        return <Description text={props.text} style={componentProps.style} />;
      case "Graph":
        return <Graph chartType={props.chartType} />;
      default:
        return <Component {...props} />;
    }
  };
  return (
    <div
      ref={setNodeRef}
      style={componentStyle}
      {...attributes}
      {...listeners}
      className={`p-4 bg-white rounded-lg shadow-sm cursor-grab ${selectionClasses} transition-all`}
      onClick={() => onSelect(id)}
      {...dragHandlers}
    >
      {renderComponent()}
      {component.type === "Image" && isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center rounded-lg border-2 border-dashed border-white">
          <p className="text-white font-bold text-lg">Drop to Upload</p>
        </div>
      )}
    </div>
  );
};

// --- Properties Panel ---
const PropertiesPanel = ({ selectedComponent, onUpdate, onDeselect }) => {
  if (!selectedComponent)
    return (
      <div className="p-6 bg-white h-full border-l border-slate-200">
        <h3 className="font-semibold text-lg text-slate-800">Properties</h3>
        <p className="mt-2 text-sm text-slate-500">
          Click a component to edit.
        </p>
      </div>
    );
  const { type, props } = selectedComponent;
  const handleTableStructureChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newPropValue = type === "checkbox" ? checked : parseInt(value, 10);
    let currentRows = props.rows;
    let currentCol = props.cols;
    let currentData = JSON.parse(JSON.stringify(props.data));
    let newProps = { ...props, [name]: newPropValue };
    if (name === "rows" || name === "cols" || name === "hasHeader") {
      const newRows = name === "rows" ? newPropValue : currentRows;
      const newCols = name === "cols" ? newPropValue : currentCol;
      const headerDiff = newCols - currentData.headers.length;
      if (headerDiff > 0) {
        currentData.headers = [
          ...currentData.headers,
          ...Array(headerDiff).fill("New Header"),
        ];
      } else {
        currentData.headers.length = newCols;
      }
      const newCellRows = props.hasHeader ? newRows - 1 : newRows;
      let newCells = currentData.cells;
      const rowDiff = newCellRows - newCells.length;
      if (rowDiff > 0) {
        for (let i = 0; i < rowDiff; i++) {
          newCells.push(Array(newCols).fill("New Cell"));
        }
      } else {
        newCells.length = newCellRows;
      }
      newCells = newCells.map((row) => {
        const colDiff = newCols - row.length;
        if (colDiff > 0) {
          return [...row, ...Array(colDiff).fill("New Cell")];
        }
        row.length = newCols;
        return row;
      });
      newProps.data = { headers: currentData.headers, cells: newCells };
    }
    onUpdate(selectedComponent.id, newProps);
  };
  const handlePropChange = (e) =>
    onUpdate(selectedComponent.id, {
      ...props,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const handleStyleChange = (e) =>
    onUpdate(selectedComponent.id, {
      ...props,
      styles: {
        ...props.styles,
        [e.target.name]:
          e.target.type === "number"
            ? parseInt(e.target.value, 10)
            : e.target.value,
      },
    });
  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const newSrc = URL.createObjectURL(file);
      if (props.src && props.src.startsWith("blob:")) {
        URL.revokeObjectURL(props.src);
      }
      onUpdate(selectedComponent.id, { ...props, src: newSrc });
    }
  };
  const renderFields = () => {
    switch (type) {
      case "Text":
        return (
          <div className="space-y-2">
            <label htmlFor="text" className="font-medium text-sm">
              Content
            </label>
            <Textarea
              name="text"
              id="text"
              value={props.text}
              onChange={handlePropChange}
              rows={4}
            />
          </div>
        );
      case "Description":
        return (
          <div className="space-y-2">
            <label htmlFor="text" className="font-medium text-sm">
              Content
            </label>
            <Textarea
              name="text"
              id="text"
              value={props.text}
              onChange={handlePropChange}
              rows={5}
            />
          </div>
        );
      case "Graph":
        return (
          <div className="space-y-2">
            <label htmlFor="chartType" className="font-medium text-sm">
              Chart Type
            </label>
            <select
              name="chartType"
              id="chartType"
              value={props.chartType}
              onChange={handlePropChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        );
      case "Table":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="rows" className="font-medium text-sm">
                  Rows
                </label>
                <Input
                  type="number"
                  name="rows"
                  id="rows"
                  value={props.rows}
                  onChange={handleTableStructureChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cols" className="font-medium text-sm">
                  Columns
                </label>
                <Input
                  type="number"
                  name="cols"
                  id="cols"
                  value={props.cols}
                  onChange={handleTableStructureChange}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                name="hasHeader"
                id="hasHeader"
                checked={props.hasHeader}
                onChange={handleTableStructureChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hasHeader" className="font-medium text-sm">
                Enable Table Header
              </label>
            </div>
          </>
        );
      case "Image":
        return (
          <>
            <div className="space-y-2">
              <label htmlFor="src" className="font-medium text-sm">
                Image URL
              </label>
              <Input
                name="src"
                id="src"
                value={props.src}
                onChange={handlePropChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image-upload" className="font-medium text-sm">
                Or Upload From Computer
              </label>
              <Input
                type="file"
                name="image-upload"
                id="image-upload"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="pt-2"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="alt" className="font-medium text-sm">
                Alt Text
              </label>
              <Input
                name="alt"
                id="alt"
                value={props.alt}
                onChange={handlePropChange}
              />
            </div>
          </>
        );
      case "Input":
      case "Textarea":
        return (
          <>
            <div className="space-y-2">
              <label htmlFor="label" className="font-medium text-sm">
                Label
              </label>
              <Input
                name="label"
                id="label"
                value={props.label}
                onChange={handlePropChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="placeholder" className="font-medium text-sm">
                Placeholder
              </label>
              <Input
                name="placeholder"
                id="placeholder"
                value={props.placeholder}
                onChange={handlePropChange}
              />
            </div>
          </>
        );
      case "Button":
        return (
          <div className="space-y-2">
            <label htmlFor="text" className="font-medium text-sm">
              Button Text
            </label>
            <Input
              name="text"
              id="text"
              value={props.text}
              onChange={handlePropChange}
            />
          </div>
        );
      default:
        return <p>No editable properties.</p>;
    }
  };
  return (
    <div className="p-6 bg-white h-full border-l border-slate-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-slate-800">
          {type} Properties
        </h3>
        <button
          onClick={onDeselect}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          &times; Close
        </button>
      </div>
      <div className="space-y-4">{renderFields()}</div>
      <hr className="my-6" />
      <h4 className="font-semibold text-md text-slate-800 mb-4">Styling</h4>
      <div className="grid grid-cols-2 gap-4">
        {props.styles.color !== undefined && (
          <div className="space-y-2 col-span-2">
            <label htmlFor="color" className="font-medium text-sm">
              Font Color
            </label>
            <Input
              type="color"
              name="color"
              id="color"
              value={props.styles.color}
              onChange={handleStyleChange}
              className="w-full h-10"
            />
          </div>
        )}
        {props.styles.fontSize !== undefined && (
          <div className="space-y-2 col-span-2">
            <label htmlFor="fontSize" className="font-medium text-sm">
              Font Size (px)
            </label>
            <Input
              type="number"
              name="fontSize"
              id="fontSize"
              value={props.styles.fontSize}
              onChange={handleStyleChange}
            />
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="marginTop" className="font-medium text-sm">
            Margin Top
          </label>
          <Input
            type="number"
            name="marginTop"
            value={props.styles.marginTop}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="marginBottom" className="font-medium text-sm">
            Margin Bottom
          </label>
          <Input
            type="number"
            name="marginBottom"
            value={props.styles.marginBottom}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="marginLeft" className="font-medium text-sm">
            Margin Left
          </label>
          <Input
            type="number"
            name="marginLeft"
            value={props.styles.marginLeft}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="marginRight" className="font-medium text-sm">
            Margin Right
          </label>
          <Input
            type="number"
            name="marginRight"
            value={props.styles.marginRight}
            onChange={handleStyleChange}
          />
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, components }) => {
  if (!isOpen) return null;
  const generateComponentCode = () => {
    const componentJSX = components
      .map((c) => {
        const { styles, ...props } = c.props;
        const styleString = `style={${JSON.stringify(styles)}}`;
        const propsString = Object.entries(props)
          .map(([key, value]) => {
            if (key === "data") {
              return `${key}={${JSON.stringify(value)}}`;
            }
            if (typeof value === "string") return `${key}="${value}"`;
            return `${key}={${JSON.stringify(value)}}`;
          })
          .join(" ");
        return `        <${c.type} ${propsString} ${styleString} />`;
      })
      .join("\n");
    const imports = `import { ${[
      ...new Set(components.map((c) => c.type)),
    ].join(", ")} } from '@/components/ui';`;
    return `import React from 'react';\n${imports}\n\nexport default function GeneratedPage() {\n  return (\n    <div className="p-8 space-y-4">\n${componentJSX}\n    </div>\n  );\n}`;
  };
  const pageJson = JSON.stringify(
    { name: "Exported Page", components },
    null,
    2,
  );
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full h-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Export Page</h2>
          <button onClick={onClose} className="text-2xl font-bold">
            &times;
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
          <div>
            <h3 className="font-semibold mb-2">Generated React Component</h3>
            <pre className="bg-slate-900 text-white p-4 rounded-lg text-sm overflow-x-auto h-[calc(80vh-100px)]">
              {generateComponentCode()}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Page JSON Data</h3>
            <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto h-[calc(80vh-100px)]">
              {pageJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function DragAdvanced() {
  const availableComponents = useMemo(() => Object.keys(COMPONENT_MAP), []);
  const [canvasComponents, setCanvasComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
  );
  const handleUpdateComponent = (id, newProps) =>
    setCanvasComponents((c) =>
      c.map((comp) => (comp.id === id ? { ...comp, props: newProps } : comp)),
    );
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const isAddingNewComponent = availableComponents.includes(active.id);
    if (isAddingNewComponent) {
      const newComponent = {
        id: `${active.id}-${Date.now()}`,
        type: active.id,
        props: JSON.parse(JSON.stringify(DEFAULT_PROPS[active.id])),
      };
      const overIndex = canvasComponents.findIndex((c) => c.id === over.id);
      if (overIndex !== -1) {
        setCanvasComponents((prev) => {
          const newItems = [...prev];
          newItems.splice(overIndex, 0, newComponent);
          return newItems;
        });
      } else {
        setCanvasComponents((prev) => [...prev, newComponent]);
      }
      return;
    }
    const isActiveAComponentOnCanvas = canvasComponents.some(
      (c) => c.id === active.id,
    );
    const isOverAComponentOnCanvas = canvasComponents.some(
      (c) => c.id === over.id,
    );
    if (
      isActiveAComponentOnCanvas &&
      isOverAComponentOnCanvas &&
      active.id !== over.id
    ) {
      const oldIndex = canvasComponents.findIndex((c) => c.id === active.id);
      const newIndex = canvasComponents.findIndex((c) => c.id === over.id);
      setCanvasComponents((items) => arrayMove(items, oldIndex, newIndex));
    }
  };
  const selectedComponent = useMemo(
    () => canvasComponents.find((c) => c.id === selectedComponentId),
    [selectedComponentId, canvasComponents],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-slate-100 font-sans">
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Components</h2>
          <div className="overflow-y-auto">
            <SortableContext
              items={availableComponents}
              strategy={verticalListSortingStrategy}
            >
              {availableComponents.map((id) => (
                <DraggableSidebarItem key={id} id={id} />
              ))}
            </SortableContext>
          </div>
        </div>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Page Canvas</h1>
            <div className="flex space-x-2">
              <Button onClick={() => setExportModalOpen(true)}>Export</Button>
              <Button
                onClick={() => {
                  setCanvasComponents([]);
                  setSelectedComponentId(null);
                }}
                variant="destructive"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="bg-white/50 min-h-full p-4 rounded-xl border border-dashed border-slate-300">
            <SortableContext
              items={canvasComponents.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {canvasComponents.length > 0 ? (
                  canvasComponents.map((c) => (
                    <SortableCanvasItem
                      key={c.id}
                      id={c.id}
                      component={c}
                      onSelect={setSelectedComponentId}
                      isSelected={selectedComponentId === c.id}
                      onUpdate={handleUpdateComponent}
                    />
                  ))
                ) : (
                  <div className="text-center py-20 pointer-events-none">
                    <p className="text-slate-500">Drag components here.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        </main>
        <aside className="w-96">
          <PropertiesPanel
            selectedComponent={selectedComponent}
            onUpdate={handleUpdateComponent}
            onDeselect={() => setSelectedComponentId(null)}
          />
        </aside>
      </div>
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        components={canvasComponents}
      />
    </DndContext>
  );
}
