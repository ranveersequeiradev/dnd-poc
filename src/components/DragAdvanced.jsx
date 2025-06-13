import React, { useState, useCallback, useMemo } from "react";
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

// --- SHADCN/UI COMPONENT IMPORTS ---
// In a real project, you would import these directly from your components folder
// e.g., import { Button } from '@/components/ui/button';
// For this POC, we'll continue to use mock components.

const Button = React.forwardRef(({ children, variant, ...props }, ref) => (
  <button
    ref={ref}
    className={`px-4 py-2 rounded-lg font-semibold text-white ${variant === "destructive" ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-700"} focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 transition-colors`}
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
// --- COMPONENT INFRASTRUCTURE ---
// This map is the key to dynamically rendering components.
const COMPONENT_MAP = {
  Button,
  Input,
  Textarea,
  Separator,
  Image,
};

// Default props and styles for new components.
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
  Select: {
    label: "Choose an option",
    options: "Option 1,Option 2,Option 3",
    styles: {
      marginTop: 10,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#334155",
    },
  },
  Checkbox: {
    label: "Accept terms",
    checked: false,
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
    styles: {
      marginTop: 10,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#334155",
    },
  },
  Image: {
    src: "https://www.dekoder.com/assets/mediaasset/image/DBD8X9/DBD8X9_600fd5934baa4c06b4ea595b9634a7a7.jpeg",
    alt: "A beautiful sunset",
    styles: {
      marginTop: 10,
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      fontSize: 14,
      color: "#334155",
    },
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

const SortableCanvasItem = ({ id, component, onSelect, isSelected }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const { styles, ...props } = component.props;

  const componentStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginTop: `${styles.marginTop}px`,
    marginBottom: `${styles.marginBottom}px`,
    marginLeft: `${styles.marginLeft}px`,
    marginRight: `${styles.marginRight}px`,
  };

  const textStyle = {
    fontSize: `${styles.fontSize}px`,
    color: styles.color,
  };

  const selectionClasses = isSelected
    ? "ring-2 ring-blue-500 ring-offset-2"
    : "hover:ring-2 hover:ring-blue-300";

  const renderComponent = () => {
    const Component = COMPONENT_MAP[component.type];
    if (!Component) return <div>Unknown Component</div>;

    const label = (
      <label className="font-medium text-sm" style={textStyle}>
        {props.label}
      </label>
    );

    switch (component.type) {
      case "Input":
        return (
          <div className="w-full space-y-2">
            {label}
            <Input placeholder={props.placeholder} readOnly />
          </div>
        );
      case "Textarea":
        return (
          <div className="w-full space-y-2">
            {label}
            <Textarea placeholder={props.placeholder} readOnly />
          </div>
        );
      case "Select":
        return (
          <div className="w-full space-y-2">
            {label}
            <Select options={props.options.split(",")} readOnly />
          </div>
        );
      case "Checkbox":
        return <Checkbox label={props.label} style={textStyle} readOnly />;
      case "Button":
        return (
          <Button
            variant={props.variant}
            style={{ ...textStyle, backgroundColor: "#1E293B" }}
          >
            {props.text}
          </Button>
        );
      case "Separator":
        return (
          <Separator style={{ ...textStyle, backgroundColor: "#1E293B" }} />
        );
      case "Image":
        return <Image src={props.src} alt={props.alt} style={textStyle} />;
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
    >
      {renderComponent()}
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

  const renderFields = () => {
    switch (type) {
      case "Input":
      case "Textarea":
      case "Select":
      case "Checkbox":
        return (
          <>
            {" "}
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
            </div>{" "}
            {type === "Input" && (
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
            )}{" "}
            {type === "Select" && (
              <div className="space-y-2">
                <label htmlFor="options" className="font-medium text-sm">
                  Options (comma-separated)
                </label>
                <Textarea
                  name="options"
                  id="options"
                  value={props.options}
                  onChange={handlePropChange}
                />
              </div>
            )}{" "}
          </>
        );
      case "Button":
        return (
          <>
            {" "}
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
            </div>{" "}
            <div className="space-y-2">
              <label htmlFor="variant" className="font-medium text-sm">
                Variant
              </label>
              <Select
                name="variant"
                id="variant"
                value={props.variant}
                onChange={handlePropChange}
                options={["default", "destructive"]}
              />
            </div>{" "}
          </>
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

// --- Export Modal ---
const ExportModal = ({ isOpen, onClose, components }) => {
  if (!isOpen) return null;

  const generateComponentCode = () => {
    const componentJSX = components
      .map((c) => {
        const { styles, ...props } = c.props;
        const styleString = `style={{ marginTop: '${styles.marginTop}px', marginBottom: '${styles.marginBottom}px', marginLeft: '${styles.marginLeft}px', marginRight: '${styles.marginRight}px', fontSize: '${styles.fontSize}px', color: '${styles.color}' }}`;
        const propsString = Object.entries(props)
          .map(([key, value]) => {
            if (typeof value === "string" && key !== "options")
              return `${key}="${value}"`;
            if (key === "options")
              return `${key}={[${value
                .split(",")
                .map((v) => `'${v}'`)
                .join(",")}]}`;
            return `${key}={${JSON.stringify(value)}}`;
          })
          .join(" ");
        return `    <${c.type} ${propsString} ${styleString} />`;
      })
      .join("\n");

    const imports = `import { ${[...new Set(components.map((c) => c.type))].join(", ")} } from '@/components/ui'; // Adjust path as needed`;

    return `import React, { useState, useEffect } from 'react';\n${imports}\n\nexport default function GeneratedPage() {\n  const [formData, setFormData] = useState({});\n\n  useEffect(() => {\n    // API call to fetch initial data for the form would go here.\n  }, []);\n\n  return (\n    <div className="p-8 space-y-4">\n${componentJSX}\n    </div>\n  );\n}`;
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
            <h3 className="font-semibold mb-2">Page JSON Data (for Backend)</h3>
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
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    if (availableComponents.includes(active.id)) {
      setCanvasComponents((c) => [
        ...c,
        {
          id: `${active.id}-${Date.now()}`,
          type: active.id,
          props: DEFAULT_PROPS[active.id],
        },
      ]);
    } else if (active.id !== over.id) {
      const oldIndex = canvasComponents.findIndex((c) => c.id === active.id);
      const newIndex = canvasComponents.findIndex((c) => c.id === over.id);
      setCanvasComponents(arrayMove(canvasComponents, oldIndex, newIndex));
    }
  };

  const handleUpdateComponent = (id, newProps) =>
    setCanvasComponents((c) =>
      c.map((comp) => (comp.id === id ? { ...comp, props: newProps } : comp)),
    );

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
                    />
                  ))
                ) : (
                  <div className="text-center py-20">
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
