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

// --- shadcn/ui Mock Component Imports ---
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

const Select = React.forwardRef(({ options, ...props }, ref) => (
  <select
    ref={ref}
    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
    {...props}
  >
    {options?.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
));
Select.displayName = "Select";

const Checkbox = React.forwardRef(({ label, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      ref={ref}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      {...props}
    />
    <label className="text-sm font-medium text-slate-700">{label}</label>
  </div>
));
Checkbox.displayName = "Checkbox";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-white text-slate-900 rounded-xl border bg-card text-card-foreground shadow ${className}`}
    {...props}
  />
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-slate-500 ${className}`} {...props} />
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
));
CardContent.displayName = "CardContent";

// --- Component Infrastructure ---
const COMPONENT_MAP = { Button, Input, Card, Textarea, Select, Checkbox };

const DEFAULT_PROPS = {
  Button: {
    text: "Click Me",
    variant: "default",
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  Input: {
    label: "Your Name",
    placeholder: "Enter your name",
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  Card: {
    title: "Card Title",
    description: "Card Description",
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  Textarea: {
    label: "Message",
    placeholder: "Your message here",
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  Select: {
    label: "Choose an option",
    options: "Option 1,Option 2,Option 3",
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  Checkbox: {
    label: "Accept terms",
    checked: false,
    styles: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};

// --- Draggable UI Components ---
const DraggableSidebarItem = ({ id, componentType }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform) };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-2"
    >
      <div className="bg-white p-4 rounded-lg border border-slate-200 cursor-grab shadow-sm hover:shadow-md transition-shadow text-center">
        <p className="font-medium text-slate-700">{componentType}</p>
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

  const selectionClasses = isSelected
    ? "ring-2 ring-blue-500 ring-offset-2"
    : "hover:ring-2 hover:ring-blue-300";

  const renderComponent = () => {
    const Component = COMPONENT_MAP[component.type];
    if (!Component) return <div>Unknown Component</div>;

    const label = (
      <label className="font-medium text-sm text-slate-700">
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
        return <Checkbox label={props.label} readOnly />;
      case "Button":
        return <Button variant={props.variant}>{props.text}</Button>;
      case "Card":
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
              <CardDescription>{props.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content goes here.</p>
            </CardContent>
          </Card>
        );
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
  if (!selectedComponent) {
    return (
      <div className="p-6 bg-white h-full border-l border-slate-200">
        <h3 className="font-semibold text-lg text-slate-800">Properties</h3>
        <p className="mt-2 text-sm text-slate-500">
          Click a component to edit.
        </p>
      </div>
    );
  }

  const { type, props } = selectedComponent;

  const handlePropChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newPropValue = type === "checkbox" ? checked : value;
    onUpdate(selectedComponent.id, { ...props, [name]: newPropValue });
  };

  const handleStyleChange = (e) => {
    const { name, value } = e.target;
    onUpdate(selectedComponent.id, {
      ...props,
      styles: { ...props.styles, [name]: parseInt(value, 10) || 0 },
    });
  };

  const renderFields = () => {
    switch (type) {
      case "Input":
      case "Textarea":
      case "Select":
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
            {type !== "Select" && (
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
            )}
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
            )}
          </>
        );
      case "Button":
        return (
          <>
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
            </div>
          </>
        );
      case "Checkbox":
        return (
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
        );
      case "Card":
        return (
          <>
            <div className="space-y-2">
              <label htmlFor="title" className="font-medium text-sm">
                Title
              </label>
              <Input
                name="title"
                id="title"
                value={props.title}
                onChange={handlePropChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="font-medium text-sm">
                Description
              </label>
              <Input
                name="description"
                id="description"
                value={props.description}
                onChange={handlePropChange}
              />
            </div>
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
        <div className="space-y-2">
          <label htmlFor="marginTop" className="font-medium text-sm">
            Margin Top
          </label>
          <Input
            type="number"
            name="marginTop"
            id="marginTop"
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
            id="marginBottom"
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
            id="marginLeft"
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
            id="marginRight"
            value={props.styles.marginRight}
            onChange={handleStyleChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="paddingTop" className="font-medium text-sm">
            Padding Top
          </label>
          <Input
            type="number"
            name="paddingTop"
            id="paddingTop"
            value={props.styles.paddingTop}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="paddingBottom" className="font-medium text-sm">
            Padding Bottom
          </label>
          <Input
            type="number"
            name="paddingBottom"
            id="paddingBottom"
            value={props.styles.paddingBottom}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="paddingLeft" className="font-medium text-sm">
            Padding Left
          </label>
          <Input
            type="number"
            name="paddingLeft"
            id="paddingLeft"
            value={props.styles.paddingLeft}
            onChange={handleStyleChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="paddingRight" className="font-medium text-sm">
            Padding Right
          </label>
          <Input
            type="number"
            name="paddingRight"
            id="paddingRight"
            value={props.styles.paddingRight}
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
    let imports = new Set(["React", "useState", "useEffect"]);
    const componentJSX = components
      .map((c) => {
        imports.add(c.type);
        const { styles, ...props } = c.props;
        const styleString = `style={{ marginTop: '${styles.marginTop}px', marginBottom: '${styles.marginBottom}px', marginLeft: '${styles.marginLeft}px', marginRight: '${styles.marginRight}px' }}`;
        const propsString = Object.entries(props)
          .map(([key, value]) => {
            if (typeof value === "string" && key !== "options")
              return `${key}="${value}"`;
            if (key === "options")
              return `${key}={[${value
                .split(",")
                .map((v) => `'${v}'`)
                .join(",")}]}`;
            return `${key}={${value}}`;
          })
          .join(" ");
        return `    <${c.type} ${propsString} ${styleString} />`;
      })
      .join("\n");

    const importString = `import { ${Array.from(imports).join(", ")} } from 'react'; // Assuming components are imported`;

    return `
${importString}

export default function GeneratedPage() {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // --- API CALL EXAMPLE ---
    // async function fetchData() {
    //   try {
    //     // const response = await fetch('/api/your-data-endpoint');
    //     // const data = await response.json();
    //     // setFormData(data);
    //   } catch (error) {
    //     console.error("Failed to fetch data:", error);
    //   }
    // }
    // fetchData();
  }, []);

  return (
    <div className="p-8 space-y-4">
${componentJSX}
    </div>
  );
}
        `;
  };

  const pageJson = JSON.stringify(
    {
      name: "My Awesome Page",
      components: components,
    },
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
export default function DragDrop() {
  const availableComponents = useMemo(
    () => ["Button", "Input", "Textarea", "Select", "Checkbox", "Card"],
    [],
  );
  const [canvasComponents, setCanvasComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (availableComponents.includes(active.id)) {
      const componentType = active.id;
      setCanvasComponents((c) => [
        ...c,
        {
          id: `${componentType}-${Date.now()}`,
          type: componentType,
          props: DEFAULT_PROPS[componentType] || {},
        },
      ]);
      return;
    }

    if (
      active.id !== over.id &&
      canvasComponents.find((c) => c.id === active.id)
    ) {
      const oldIndex = canvasComponents.findIndex((c) => c.id === active.id);
      const newIndex = canvasComponents.findIndex((c) => c.id === over.id);
      setCanvasComponents(arrayMove(canvasComponents, oldIndex, newIndex));
    }
  };

  const handleUpdateComponent = (id, newProps) => {
    setCanvasComponents((c) =>
      c.map((comp) => (comp.id === id ? { ...comp, props: newProps } : comp)),
    );
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
                <DraggableSidebarItem key={id} id={id} componentType={id} />
              ))}
            </SortableContext>
          </div>
        </div>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Drop Zone</h1>
            <div className="flex space-x-2">
              <Button onClick={() => setExportModalOpen(true)}>Export</Button>
              <Button
                onClick={() => {
                  setCanvasComponents([]);
                  setSelectedComponentId(null);
                }}
                variant="destructive"
              >
                Clear Canvas
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
