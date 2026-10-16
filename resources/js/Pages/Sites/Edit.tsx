import HexColorInput from "@/Components/HexColorInput";
import StudioElementControls from "@/Components/StudioElementControls";
import StudioContextMenu from "@/Components/StudioContextMenu";
import StudioSelectionOverlay from "@/Components/StudioSelectionOverlay";
import CanvaSelectionBar from "@/Components/CanvaSelectionBar";
import CanvaUploadPanel from "@/Components/CanvaUploadPanel";
import PublicSite from "@/Pages/Public/Site";
import "../../../css/canva-workspace.css";
import "../../../css/canva-preview.css";
import "../../../css/studio-elements.css";
import SectionAppearanceControls from "@/Components/SectionAppearanceControls";
import ImageAppearanceControls from "@/Components/ImageAppearanceControls";
import TextFormattingToolbar from "@/Components/TextFormattingToolbar";
import BusinessSettings from "@/Components/BusinessSettings";
import {
    TEXT_FONTS,
    compositionDefaultsFor,
    normalizedTheme,
} from "@/lib/publicTheme";
import { colorContrastRatio, readableTextColor } from "@/lib/themeContrast";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

type StudioPanel =
    | "add"
    | "layers"
    | "pages"
    | "content"
    | "design"
    | "templates"
    | "ai"
    | "settings"
    | "uploads";

type StudioDevice = "desktop" | "tablet" | "mobile";

type StudioToolIconName =
    | StudioDevice
    | "add"
    | "ai"
    | "back"
    | "content"
    | "delete"
    | "design"
    | "duplicate"
    | "edit"
    | "hero"
    | "hide"
    | "layers"
    | "media"
    | "pages"
    | "preview"
    | "section"
    | "settings"
    | "templates";

type AiRefinementForm = {
    prompt: string;
    scope: "site" | "page" | "section";
    page_id: number | null;
    section_id: number | null;
};

type PendingImage = {
    file: File;
    previewUrl: string;
};

const isSafeStudioLink = (value: string) => {
    if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
    if (value.startsWith("#")) return value.length > 1;
    if (value.startsWith("/")) return !value.startsWith("//");
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return true;
    if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value)) return true;
    if (/^tel:[+\d][\d+().-]*$/i.test(value)) return true;
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) && !!url.hostname;
    } catch {
        return false;
    }
};
let editorItemSequence = 0;

const nextEditorItemKey = () => `section-item-${++editorItemSequence}`;

const prepareSectionDraft = (section: any) => ({
    ...section,
    content: {
        ...section.content,
        body: (section.content?.body || "").replace(/\r\n?/g, "\n"),
        ...(Array.isArray(section.content?.items)
            ? {
                  items: section.content.items.map((item: any) => ({
                      ...item,
                      body: (item.body || "").replace(/\r\n?/g, "\n"),
                      image: item.image || "",
                      _editorKey: nextEditorItemKey(),
                  })),
              }
            : {}),
    },
});

const persistableSectionContent = (content: any) => ({
    ...content,
    ...(content.links != null && Object.keys(content.links).length === 0
        ? { links: null }
        : {}),
    ...(content.element_layouts != null &&
    Object.keys(content.element_layouts).length === 0
        ? { element_layouts: null }
        : {}),
    ...(content.items
        ? {
              items: content.items.map((item: any) => {
                  const persistedItem = { ...item };
                  delete persistedItem._editorKey;

                  return persistedItem;
              }),
          }
        : {}),
});

const remapItemDesignAfterDelete = (content: any, removedIndex: number) =>
    Object.fromEntries(
        ["links", "element_layouts"].map((field) => [
            field,
            content[field]
                ? Object.fromEntries(
                      Object.entries(content[field]).flatMap(([key, value]) => {
                          const match =
                              /^item_(\d+)_(title|description|image)$/.exec(
                                  key,
                              );
                          if (!match) return [[key, value]];
                          const index = Number(match[1]);
                          return index === removedIndex
                              ? []
                              : [
                                    [
                                        index > removedIndex
                                            ? `item_${index - 1}_${match[2]}`
                                            : key,
                                        value,
                                    ],
                                ];
                      }),
                  )
                : content[field],
        ]),
    );

const sectionDraftSnapshot = (section: any) =>
    JSON.stringify({
        content: persistableSectionContent(section.content),
        is_visible: Boolean(section.is_visible),
    });

const sectionTypes = [
    "hero",
    "text",
    "services",
    "sectors",
    "features",
    "gallery",
    "testimonials",
    "faq",
    "contact",
    "map",
    "cta",
    "products",
];
const stylePresets: Record<string, any> = {
    modern: {
        primary: "#0f766e",
        secondary: "#134e4a",
        accent: "#f59e0b",
        background: "#fffdf7",
        text: "#17201e",
        heading_font: "Manrope",
        body_font: "Inter",
        radius: "16px",
        button_style: "solid",
        heading_scale: "balanced",
        motion: "subtle",
        card_style: "elevated",
        image_shape: "soft",
        divider_style: "subtle",
        header_style: "solid",
    },
    elegant: {
        primary: "#5b3a70",
        secondary: "#28252e",
        accent: "#d9bd8b",
        background: "#fffaf4",
        text: "#29242d",
        heading_font: "Playfair Display",
        body_font: "Inter",
        radius: "8px",
        button_style: "outline",
        heading_scale: "balanced",
        motion: "subtle",
        card_style: "bordered",
        image_shape: "rounded",
        divider_style: "subtle",
        header_style: "solid",
    },
    bold: {
        primary: "#3325c9",
        secondary: "#18124a",
        accent: "#ff5d3a",
        background: "#fff8ed",
        text: "#181629",
        heading_font: "Poppins",
        body_font: "DM Sans",
        radius: "24px",
        button_style: "rounded",
        heading_scale: "display",
        motion: "expressive",
        card_style: "elevated",
        image_shape: "rounded",
        divider_style: "strong",
        header_style: "contrast",
    },
    minimal: {
        primary: "#1e2825",
        secondary: "#303936",
        accent: "#8a9690",
        background: "#f7f7f3",
        text: "#1e2825",
        heading_font: "DM Sans",
        body_font: "Inter",
        radius: "0px",
        button_style: "outline",
        heading_scale: "compact",
        motion: "none",
        card_style: "flat",
        image_shape: "square",
        divider_style: "none",
        header_style: "solid",
    },
    traditional: {
        primary: "#8b2e22",
        secondary: "#4c201b",
        accent: "#e1a92f",
        background: "#fff8e8",
        text: "#3a211d",
        heading_font: "Playfair Display",
        body_font: "Manrope",
        radius: "8px",
        button_style: "solid",
        heading_scale: "balanced",
        motion: "subtle",
        card_style: "bordered",
        image_shape: "soft",
        divider_style: "strong",
        header_style: "contrast",
    },
};

export default function Edit({
    site,
    canManage,
    canManageStore = false,
    templates = [],
    previewProducts = [],
    aiGenerations = [],
    initialPanel = "content",
}: {
    site: any;
    canManage: boolean;
    canManageStore?: boolean;
    templates?: any[];
    previewProducts?: any[];
    aiGenerations?: any[];
    initialPanel?: StudioPanel;
}) {
    const { brand, flash, errors = {} } = usePage().props as any;
    const [device, setDevice] = useState<StudioDevice>(() =>
        typeof window !== "undefined" && window.innerWidth <= 600
            ? "mobile"
            : "desktop",
    );
    const [zoom, setZoom] = useState(() =>
        typeof window !== "undefined" && window.innerWidth <= 600 ? 70 : 80,
    );
    const [sidebarOpen, setSidebarOpen] = useState(
        () => typeof window === "undefined" || window.innerWidth > 900,
    );
    const [publishing, setPublishing] = useState(false);
    const [pageId, setPageId] = useState(site.pages?.[0]?.id);
    const [editing, setEditingState] = useState<any>(null);
    const editingRef = useRef<any>(null);
    editingRef.current = editing;
    const history = useRef<{ past: any[]; future: any[] }>({
        past: [],
        future: [],
    });
    const [historyVersion, setHistoryVersion] = useState(0);
    const gestureSnapshot = useRef<any>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
        null,
    );
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [linkDraft, setLinkDraft] = useState("");
    const [linkError, setLinkError] = useState("");
    const setEditing = (nextValue: any) => {
        const previous = editingRef.current;
        const next =
            typeof nextValue === "function" ? nextValue(previous) : nextValue;
        if (
            previous &&
            next &&
            previous.id === next.id &&
            !gestureSnapshot.current &&
            sectionDraftSnapshot(previous) !== sectionDraftSnapshot(next)
        ) {
            history.current.past.push(JSON.parse(JSON.stringify(previous)));
            history.current.past = history.current.past.slice(-50);
            history.current.future = [];
            setHistoryVersion((v) => v + 1);
        } else if (previous?.id !== next?.id) {
            history.current = { past: [], future: [] };
            setHistoryVersion((v) => v + 1);
        }
        editingRef.current = next;
        setEditingState(next);
    };
    const undoDraft = () => {
        const previous = history.current.past.pop();
        if (!previous || savingSection || publishing) return;
        history.current.future.push(editingRef.current);
        editingRef.current = previous;
        setEditingState(previous);
        setHistoryVersion((v) => v + 1);
    };
    const redoDraft = () => {
        const next = history.current.future.pop();
        if (!next || savingSection || publishing) return;
        history.current.past.push(editingRef.current);
        editingRef.current = next;
        setEditingState(next);
        setHistoryVersion((v) => v + 1);
    };
    const [activeTextField, setActiveTextField] = useState("heading");
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [selectionKind, setSelectionKind] = useState<
        "text" | "image" | "section" | "shape"
    >("section");
    const [propertyPanel, setPropertyPanel] = useState<
        "image" | "layout" | "position" | "link" | null
    >(null);
    const [editingSnapshot, setEditingSnapshot] = useState("");
    const [pendingSectionImage, setPendingSectionImage] =
        useState<PendingImage | null>(null);
    const [pendingItemImages, setPendingItemImages] = useState<
        Record<string, PendingImage>
    >({});
    const [pendingElementImages, setPendingElementImages] = useState<
        Record<string, PendingImage>
    >({});
    const [savingSection, setSavingSection] = useState(false);
    const [editorClientError, setEditorClientError] = useState("");
    const previewUrls = useRef(new Set<string>());
    const [panel, setPanel] = useState<StudioPanel>(initialPanel);
    const [addType, setAddType] = useState("text");
    const [templateQuery, setTemplateQuery] = useState("");
    const matchingTemplates = useMemo(() => {
        const normalize = (value: string) =>
            value
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .toLowerCase()
                .trim();
        const query = normalize(templateQuery);
        return templates.filter((template: any) =>
            normalize(
                `${template.name} ${template.category} ${template.description || ""}`,
            ).includes(query),
        );
    }, [templates, templateQuery]);
    const [generating, setGenerating] = useState(false);
    const [applyingTemplateKey, setApplyingTemplateKey] = useState<
        string | null
    >(null);
    const [actingGenerationId, setActingGenerationId] = useState<number | null>(
        null,
    );
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
        null,
    );
    const openPanel = (nextPanel: StudioPanel) => {
        setPanel(nextPanel);
        setSidebarOpen(true);
    };
    const page = useMemo(
        () => site.pages.find((p: any) => p.id === pageId) || site.pages[0],
        [site.pages, pageId],
    );
    const selectedSection = useMemo(
        () =>
            page?.sections?.find(
                (section: any) => section.id === selectedSectionId,
            ) || null,
        [page, selectedSectionId],
    );
    const revokePreview = (previewUrl?: string) => {
        if (!previewUrl) return;

        URL.revokeObjectURL(previewUrl);
        previewUrls.current.delete(previewUrl);
    };
    const resetPendingImages = () => {
        previewUrls.current.forEach((previewUrl) =>
            URL.revokeObjectURL(previewUrl),
        );
        previewUrls.current.clear();
        setPendingSectionImage(null);
        setPendingItemImages({});
        setPendingElementImages({});
    };
    useEffect(
        () => () => {
            previewUrls.current.forEach((previewUrl) =>
                URL.revokeObjectURL(previewUrl),
            );
            previewUrls.current.clear();
        },
        [],
    );
    const activateSection = (section: any) => {
        resetPendingImages();
        setEditorClientError("");
        const draft = prepareSectionDraft(section);
        setEditingSnapshot(sectionDraftSnapshot(draft));
        setEditing(draft);
        setSelectedSectionId(section.id);
        setSelectedElementId(null);
        setContextMenu(null);
    };
    const openSectionEditor = (section: any) => {
        if (!canManage || savingSection) return;
        const select = () => {
            if (editing?.id !== section.id) activateSection(section);
            setSelectionKind("section");
            setActiveItemIndex(null);
            setSelectedElementId(null);
            setPropertyPanel(null);
            setPanel("content");
        };
        if (editing && editing.id !== section.id && editorIsDirty)
            saveSection(editing, select);
        else select();
    };
    const editorIsDirty = useMemo(
        () =>
            Boolean(
                editing &&
                (sectionDraftSnapshot(editing) !== editingSnapshot ||
                    pendingSectionImage ||
                    Object.keys(pendingItemImages).length ||
                    Object.keys(pendingElementImages).length),
            ),
        [
            editing,
            editingSnapshot,
            pendingItemImages,
            pendingSectionImage,
            pendingElementImages,
        ],
    );
    useEffect(() => {
        if (!editing || editorIsDirty || savingSection) return;
        const saved = site.pages
            .flatMap((entry: any) => entry.sections)
            .find((entry: any) => entry.id === editing.id);
        if (!saved) {
            setEditing(null);
            setEditingSnapshot("");
            setSelectedSectionId(null);
            return;
        }
        const draft = prepareSectionDraft(saved);
        setEditing(draft);
        setEditingSnapshot(sectionDraftSnapshot(draft));
    }, [site.pages]);
    const closeSectionEditor = (force = false) => {
        if (savingSection && !force) return;
        if (
            !force &&
            editorIsDirty &&
            !confirm("Discard your unsaved section changes?")
        )
            return;

        resetPendingImages();
        setEditorClientError("");
        setEditingSnapshot("");
        setEditing(null);
        setSelectedElementId(null);
        setContextMenu(null);
        setSelectedSectionId(null);
        setPropertyPanel(null);
    };
    const validImageFile = (file: File) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setEditorClientError("Choose a JPG, PNG, or WebP image.");

            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            setEditorClientError("Images must be 5 MB or smaller.");

            return false;
        }

        setEditorClientError("");

        return true;
    };
    const previewFor = (file: File) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);

        return previewUrl;
    };
    const stageSectionImage = (file: File) => {
        if (!validImageFile(file)) return;

        revokePreview(pendingSectionImage?.previewUrl);
        setPendingSectionImage({ file, previewUrl: previewFor(file) });
    };
    const clearPendingSectionImage = () => {
        revokePreview(pendingSectionImage?.previewUrl);
        setPendingSectionImage(null);
    };
    const stageItemImage = (itemKey: string, file: File) => {
        if (!validImageFile(file)) return;

        revokePreview(pendingItemImages[itemKey]?.previewUrl);
        setPendingItemImages((current) => ({
            ...current,
            [itemKey]: { file, previewUrl: previewFor(file) },
        }));
    };
    const clearPendingItemImage = (itemKey: string) => {
        revokePreview(pendingItemImages[itemKey]?.previewUrl);
        setPendingItemImages((current) => {
            const next = { ...current };
            delete next[itemKey];

            return next;
        });
    };
    const proposedGenerations = useMemo(
        () =>
            aiGenerations
                .filter((generation: any) => generation.status === "proposed")
                .slice(0, 5),
        [aiGenerations],
    );
    const initialTemplateSlug =
        site.theme?.settings?.template_slug ||
        site.template?.slug ||
        "sajilo-launch";
    const theme = useForm({
        style: "modern",
        primary: "#0f766e",
        secondary: "#134e4a",
        accent: "#f59e0b",
        background: "#fffdf7",
        text: "#17201e",
        heading_font: "Manrope",
        body_font: "Inter",
        radius: "16px",
        button_style: "solid",
        section_spacing: "generous",
        header_layout: "split",
        footer_layout: "columns",
        ...compositionDefaultsFor(initialTemplateSlug),
        ...(site.theme?.settings || {}),
        template_slug: initialTemplateSlug,
    });
    useEffect(() => {
        if (!editorIsDirty && !theme.isDirty) return;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [editorIsDirty, theme.isDirty]);
    const ai = useForm<AiRefinementForm>({
        prompt: "",
        scope: "site",
        page_id: null,
        section_id: null,
    });
    const move = (index: number, direction: number) => {
        if (!canManage) return;
        const list = [...page.sections];
        const target = index + direction;
        if (target < 0 || target >= list.length) return;
        [list[index], list[target]] = [list[target], list[index]];
        router.patch(
            route("sections.reorder", { site: site.id, page: page.id }),
            { sections: list.map((s: any) => s.id) },
            { preserveScroll: true },
        );
    };
    const saveSection = (section: any, afterSave?: () => void) => {
        if (savingSection) return;

        const payload: Record<string, any> = {
            _method: "patch",
            content: persistableSectionContent(section.content),
            is_visible: section.is_visible ? 1 : 0,
        };
        if (
            Array.isArray(section.content.items) &&
            section.content.items.length === 0
        ) {
            payload.items_empty = 1;
        }
        if (pendingSectionImage) {
            payload.section_image = pendingSectionImage.file;
        }

        const itemImages: Record<number, File> = {};
        section.content.items?.forEach((item: any, index: number) => {
            const pendingImage = pendingItemImages[item._editorKey];
            if (pendingImage) itemImages[index] = pendingImage.file;
        });
        if (Object.keys(itemImages).length) payload.item_images = itemImages;
        const elementImages: Record<number, File> = {};
        section.content.elements?.forEach((element: any, index: number) => {
            if (pendingElementImages[element.id])
                elementImages[index] = pendingElementImages[element.id].file;
        });
        if (Object.keys(elementImages).length)
            payload.element_images = elementImages;
        if (
            Array.isArray(section.content.elements) &&
            section.content.elements.length === 0
        )
            payload.elements_empty = 1;

        setSavingSection(true);
        setEditorClientError("");
        router.post(
            route("sections.update", { site: site.id, section: section.id }),
            payload,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (response) => {
                    const updated = (response.props as any).site?.pages
                        ?.flatMap((p: any) => p.sections)
                        .find((entry: any) => entry.id === section.id);
                    resetPendingImages();
                    if (updated) {
                        const draft = prepareSectionDraft(updated);
                        setEditingSnapshot(sectionDraftSnapshot(draft));
                        setEditing(draft);
                    }
                    afterSave?.();
                },
                onError: () => {
                    setPublishing(false);
                    setEditorClientError(
                        "Your changes are still here. Fix the highlighted settings and save again.",
                    );
                },
                onFinish: () => setSavingSection(false),
            },
        );
    };
    const saveTheme = () =>
        theme.patch(route("themes.update", site.id), {
            preserveScroll: true,
            onSuccess: () => theme.setDefaults(),
        });
    const createPage = () => {
        if (!canManage) return;

        const title = prompt("New page name");
        if (title?.trim()) {
            router.post(
                route("pages.store", site.id),
                { title: title.trim() },
                { preserveScroll: true },
            );
        }
    };
    const createSection = () => {
        if (!canManage || !page) return;

        router.post(
            route("sections.store", {
                site: site.id,
                page: page.id,
            }),
            { type: addType },
            { preserveScroll: true },
        );
    };
    const toggleSectionVisibility = (section: any) => {
        if (!canManage || savingSection) return;
        if (editing?.id === section.id) {
            setEditing({ ...editing, is_visible: !editing.is_visible });
            return;
        }

        router.patch(
            route("sections.update", {
                site: site.id,
                section: section.id,
            }),
            {
                content: section.content,
                is_visible: !section.is_visible,
            },
            { preserveScroll: true },
        );
    };
    const duplicateSection = (section: any) => {
        if (!canManage) return;

        router.post(
            route("sections.duplicate", {
                site: site.id,
                section: section.id,
            }),
            {},
            { preserveScroll: true },
        );
    };
    const deleteSection = (section: any) => {
        if (!canManage || !confirm("Remove this section?")) return;

        router.delete(
            route("sections.destroy", {
                site: site.id,
                section: section.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => closeSectionEditor(true),
            },
        );
    };
    const saveDraft = (afterSave?: () => void) => {
        const saveDesign = () => {
            if (theme.isDirty)
                theme.patch(route("themes.update", site.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        theme.setDefaults();
                        afterSave?.();
                    },
                    onError: () => setPublishing(false),
                });
            else afterSave?.();
        };
        if (editing && editorIsDirty) saveSection(editing, saveDesign);
        else saveDesign();
    };
    const publishSite = () => {
        if (!canManage || savingSection || theme.processing || publishing)
            return;
        setPublishing(true);
        saveDraft(() =>
            router.post(
                route("sites.publish", site.id),
                {},
                { preserveScroll: true, onFinish: () => setPublishing(false) },
            ),
        );
    };
    const selectPage = (nextPageId: number) => {
        const changePage = () => {
            resetPendingImages();
            setEditing(null);
            setEditingSnapshot("");
            setSelectedSectionId(null);
            setPageId(nextPageId);
            setPropertyPanel(null);
        };
        if (editing && editorIsDirty) saveSection(editing, changePage);
        else changePage();
    };
    const selectCanvasText = (
        sectionId: number,
        field: string,
        itemIndex?: number,
    ) => {
        const section = page.sections.find(
            (entry: any) => entry.id === sectionId,
        );
        if (!section || savingSection || !canManage) return;
        const select = () => {
            if (editing?.id !== sectionId) activateSection(section);
            setSelectedElementId(null);
            setActiveTextField(field);
            setActiveItemIndex(itemIndex ?? null);
            setSelectionKind("text");
            setPropertyPanel(null);
        };
        if (editing && editing.id !== sectionId && editorIsDirty)
            saveSection(editing, select);
        else select();
    };
    const selectCanvasImage = (sectionId: number, itemIndex?: number) => {
        const section = page.sections.find(
            (entry: any) => entry.id === sectionId,
        );
        if (!section || savingSection || !canManage) return;
        const select = () => {
            if (editing?.id !== sectionId) activateSection(section);
            setActiveItemIndex(itemIndex ?? null);
            setSelectedElementId(null);
            setActiveTextField("image");
            setSelectionKind("image");
            setPropertyPanel(null);
        };
        if (editing && editing.id !== sectionId && editorIsDirty)
            saveSection(editing, select);
        else select();
    };
    const updateCanvasText = (
        sectionId: number,
        field: string,
        text: string,
        itemIndex?: number,
    ) => {
        if (!canManage || savingSection || publishing) return;
        if (
            !editing &&
            !page.sections.some((section: any) => section.id === sectionId)
        )
            return;
        const source =
            editing?.id === sectionId
                ? editing
                : prepareSectionDraft(
                      page.sections.find(
                          (entry: any) => entry.id === sectionId,
                      ),
                  );
        if (!source) return;
        setEditorClientError("");
        if (itemIndex != null) {
            const items = [...source.content.items];
            items[itemIndex] = {
                ...items[itemIndex],
                [field === "description" ? "body" : field]: text,
            };
            setEditing({ ...source, content: { ...source.content, items } });
        } else
            setEditing({
                ...source,
                content: { ...source.content, [field]: text },
            });
    };
    const submitAiRefinement = (draftSaved = false) => {
        if (!draftSaved && editing && editorIsDirty) {
            saveSection(editing, () => submitAiRefinement(true));
            return;
        }
        if (!canManage) return;

        ai.transform((data) => ({
            ...data,
            page_id: data.scope === "site" ? null : (page?.id ?? null),
            section_id:
                data.scope === "section" ? (selectedSection?.id ?? null) : null,
        }));
        ai.post(route("ai.refinements.store", { site: site.id }), {
            preserveScroll: true,
            onSuccess: () => ai.reset("prompt"),
        });
    };
    const currentTemplateId = site.template_id ?? site.template?.id;
    const applyTemplate = (
        template: any,
        mode: "design" | "layout",
        draftSaved = false,
    ) => {
        if (!draftSaved && editing && editorIsDirty) {
            saveSection(editing, () => applyTemplate(template, mode, true));
            return;
        }
        if (mode === "layout") {
            setEditing(null);
            setEditingSnapshot("");
            setSelectedSectionId(null);
        }
        if (!canManage) return;

        const actionLabel =
            mode === "layout"
                ? `Apply the full ${template.name} composition? Nirmaan will reorganize your Home page, keep content from matching sections, add any missing sections, and leave unmatched sections at the end. Your live website will not change until you publish.`
                : `Apply the ${template.name} visual design? Your sections and their order will stay exactly where they are. Your live website will not change until you publish.`;

        if (!confirm(actionLabel)) return;

        const actionKey = `${template.id}:${mode}`;
        setApplyingTemplateKey(actionKey);
        router.post(
            route("templates.apply", { site: site.id }),
            { template_id: template.id, mode },
            {
                preserveScroll: true,
                onFinish: () => setApplyingTemplateKey(null),
                onSuccess: () => {
                    const selectedTheme = normalizedTheme(
                        template.theme || {},
                        template.slug,
                    );

                    theme.setData(selectedTheme);
                    theme.setDefaults(selectedTheme);
                },
            },
        );
    };
    const paletteContrast = colorContrastRatio(
        theme.data.text,
        theme.data.background,
    );
    const palettePasses = paletteContrast >= 4.5;
    const toolItems: Array<{
        value: StudioPanel;
        label: string;
        icon: StudioToolIconName;
    }> = [
        { value: "add", label: "Elements", icon: "add" },
        { value: "uploads", label: "Uploads", icon: "media" },
        { value: "layers", label: "Layers", icon: "layers" },
        { value: "pages", label: "Pages", icon: "pages" },
        { value: "content", label: "Content", icon: "content" },
        { value: "design", label: "Styles", icon: "design" },
        { value: "templates", label: "Themes", icon: "templates" },
        { value: "ai", label: "AI tools", icon: "ai" },
        { value: "settings", label: "Settings", icon: "settings" },
    ];
    const panelTitle =
        toolItems.find((item) => item.value === panel)?.label || "Studio tools";
    const saveState = savingSection
        ? "Saving changes…"
        : editorIsDirty
          ? "Unsaved content changes"
          : theme.processing
            ? "Saving design…"
            : theme.isDirty
              ? "Unsaved design changes"
              : theme.recentlySuccessful
                ? "Design saved"
                : "All changes saved";
    const previewUrl = route("sites.preview", {
        site: site.id,
        ...(page?.slug ? { pageSlug: page.slug } : {}),
    });
    const canvasWidth =
        device === "desktop" ? 1200 : device === "tablet" ? 768 : 390;
    const sectionImageContentKey =
        editing?.type === "hero" ? "background_image" : "image";
    const currentSectionImage =
        pendingSectionImage?.previewUrl ||
        editing?.content?.[sectionImageContentKey] ||
        "";
    const sectionEditorErrors = Object.entries(errors).filter(([field]) =>
        /^(content|is_visible|section_image|item_images)/.test(field),
    );

    const activeItem =
        activeItemIndex != null
            ? editing?.content?.items?.[activeItemIndex]
            : null;
    const activeElement = selectedElementId
        ? editing?.content?.elements?.find(
              (element: any) => element.id === selectedElementId,
          )
        : null;
    const activeDesignKey =
        activeItemIndex != null
            ? `item_${activeItemIndex}_${selectionKind === "image" ? "image" : activeTextField}`
            : selectionKind === "image"
              ? "image"
              : activeTextField;
    const activeLayout =
        activeElement?.layout ||
        editing?.content?.element_layouts?.[activeDesignKey] ||
        {};
    const activeFormatting = activeElement || activeItem || editing?.content;
    const activeLabel = activeElement
        ? `${activeElement.type === "button" ? "Button text" : activeElement.type}`
        : selectionKind === "shape"
          ? "Shape"
          : activeItem
            ? `Item ${activeItemIndex! + 1} ${activeTextField === "title" ? "title" : "description"}`
            : activeTextField === "eyebrow"
              ? "Small text"
              : activeTextField === "body"
                ? "Description"
                : activeTextField === "action"
                  ? "Button text"
                  : activeTextField === "primary_action"
                    ? "Primary button text"
                    : activeTextField === "secondary_action"
                      ? "Secondary button text"
                      : activeTextField.replace(/_/g, " ");
    const buttonSelected = [
        "action",
        "primary_action",
        "secondary_action",
    ].includes(activeTextField);
    const selectedImage = activeElement
        ? pendingElementImages[activeElement.id]?.previewUrl ||
          activeElement.image ||
          ""
        : activeItem
          ? pendingItemImages[activeItem._editorKey]?.previewUrl ||
            activeItem.image ||
            ""
          : currentSectionImage;
    const updateFormatting = (format: {
        font?: string | null;
        color?: string | null;
        style?: any;
    }) => {
        if (!editing || savingSection || publishing) return;
        if (activeElement) {
            updateElement({
                font: format.font,
                color: format.color,
                text_style: format.style,
            });
            return;
        }
        if (activeItem) {
            const items = [...editing.content.items];
            items[activeItemIndex!] = {
                ...activeItem,
                [`${activeTextField}_font`]: format.font,
                [`${activeTextField}_color`]: format.color,
                [`${activeTextField}_style`]: format.style,
            };
            setEditing({ ...editing, content: { ...editing.content, items } });
        } else
            setEditing({
                ...editing,
                content: {
                    ...editing.content,
                    [`${activeTextField}_font`]: format.font,
                    [`${activeTextField}_color`]: format.color,
                    [`${activeTextField}_style`]: format.style,
                },
            });
    };
    const updateImage = (image_style: any) => {
        if (!editing || savingSection || publishing) return;
        if (activeItem) {
            const items = [...editing.content.items];
            items[activeItemIndex!] = { ...activeItem, image_style };
            setEditing({ ...editing, content: { ...editing.content, items } });
        } else
            setEditing({
                ...editing,
                content: { ...editing.content, image_style },
            });
    };
    const removeSelectedImage = () => {
        if (!editing) return;
        if (activeElement) {
            revokePreview(pendingElementImages[activeElement.id]?.previewUrl);
            setPendingElementImages((current) => {
                const next = { ...current };
                delete next[activeElement.id];
                return next;
            });
            updateElement({ image: "" });
            return;
        }
        if (activeItem) {
            clearPendingItemImage(activeItem._editorKey);
            const items = [...editing.content.items];
            items[activeItemIndex!] = { ...activeItem, image: "" };
            setEditing({ ...editing, content: { ...editing.content, items } });
        } else {
            clearPendingSectionImage();
            setEditing({
                ...editing,
                content: { ...editing.content, [sectionImageContentKey]: "" },
            });
        }
    };
    const updateElement = (patch: any, id = selectedElementId) => {
        const current = editingRef.current;
        if (!current || !id || savingSection || publishing) return;
        if ("image" in patch && pendingElementImages[id]) {
            revokePreview(pendingElementImages[id].previewUrl);
            setPendingElementImages((images) => {
                const next = { ...images };
                delete next[id];
                return next;
            });
        }
        setEditing({
            ...current,
            content: {
                ...current.content,
                elements: (current.content.elements || []).map(
                    (element: any) =>
                        element.id === id ? { ...element, ...patch } : element,
                ),
            },
        });
    };
    const updateLayout = (patch: any) => {
        const current = editingRef.current;
        if (!current || savingSection || publishing) return;
        if (selectedElementId) {
            const element = current.content.elements?.find(
                (entry: any) => entry.id === selectedElementId,
            );
            if (element)
                updateElement({ layout: { ...element.layout, ...patch } });
        } else
            setEditing({
                ...current,
                content: {
                    ...current.content,
                    element_layouts: {
                        ...current.content.element_layouts,
                        [activeDesignKey]: {
                            ...current.content.element_layouts?.[
                                activeDesignKey
                            ],
                            ...patch,
                        },
                    },
                },
            });
    };
    const resetLayout = () => {
        if (activeElement)
            updateElement({
                layout: {
                    x: 35,
                    y: 35,
                    width: 25,
                    height: 160,
                    rotation: 0,
                    layer: 4,
                },
            });
        else {
            const element_layouts = { ...editing.content.element_layouts };
            element_layouts[activeDesignKey] = null;
            setEditing({
                ...editing,
                content: { ...editing.content, element_layouts },
            });
        }
    };
    const selectCanvasElement = (sectionId: number, id: string) => {
        if (!canManage || savingSection || publishing) return;
        const section = page.sections.find(
            (entry: any) => entry.id === sectionId,
        );
        if (!section) return;
        const select = () => {
            if (editing?.id !== sectionId) activateSection(section);
            const element = (
                editing?.id === sectionId ? editing.content : section.content
            ).elements?.find((entry: any) => entry.id === id);
            if (!element) return;
            setSelectedElementId(id);
            setActiveItemIndex(null);
            setActiveTextField("text");
            setSelectionKind(
                element.type === "image"
                    ? "image"
                    : element.type === "shape"
                      ? "shape"
                      : "text",
            );
            setPropertyPanel(null);
        };
        if (editing && editing.id !== sectionId && editorIsDirty)
            saveSection(editing, select);
        else select();
    };
    const selectCanvasDecoration = (sectionId: number) => {
        const section = page.sections.find(
            (entry: any) => entry.id === sectionId,
        );
        if (!section || !canManage || savingSection || publishing) return;
        const select = () => {
            if (editing?.id !== sectionId) activateSection(section);
            setSelectedElementId(null);
            setActiveItemIndex(null);
            setActiveTextField("decoration");
            setSelectionKind("shape");
            setPropertyPanel(null);
        };
        if (editing && editing.id !== sectionId && editorIsDirty)
            saveSection(editing, select);
        else select();
    };
    const addDesignElement = (type: string, shape = "rectangle") => {
        if (!canManage || savingSection || publishing) return;
        const source = editing || page?.sections[0];
        if (!source) {
            setEditorClientError(
                "Add a section first, then place text, images, shapes, or buttons inside it.",
            );
            return;
        }
        if ((source.content.elements || []).length >= 30) {
            setEditorClientError(
                "This section already has 30 elements. Choose another section to add more.",
            );
            return;
        }
        const current = editing || prepareSectionDraft(source);
        if (!editing) activateSection(source);
        const id = `element-${crypto.randomUUID()}`;
        const element = {
            id,
            type,
            shape,
            text:
                type === "button"
                    ? "Your button"
                    : type === "text"
                      ? "Your text"
                      : "",
            image: "",
            image_alt: "",
            font: theme.data.body_font,
            color:
                type === "button"
                    ? readableTextColor(theme.data.primary)
                    : theme.data.text,
            fill: theme.data.primary,
            radius: type === "button" ? 12 : 0,
            text_style: { size: type === "text" ? 32 : 16 },
            layout: {
                x: 20,
                y: 65,
                width: type === "text" ? 45 : type === "button" ? 25 : 25,
                height:
                    type === "text"
                        ? 88
                        : type === "button"
                          ? 56
                          : shape === "line"
                            ? 16
                            : 160,
                rotation: 0,
                layer: 4,
            },
        };
        setEditing({
            ...current,
            content: {
                ...current.content,
                appearance: {
                    ...current.content.appearance,
                    min_height: Math.max(
                        600,
                        current.content.appearance?.min_height || 0,
                    ),
                },
                elements: [...(current.content.elements || []), element],
            },
        });
        setSelectedSectionId(source.id);
        setSelectedElementId(id);
        setActiveItemIndex(null);
        setActiveTextField("text");
        setSelectionKind(
            type === "image" ? "image" : type === "shape" ? "shape" : "text",
        );
        setPropertyPanel(type === "shape" ? "position" : null);
        setEditorClientError("");
        if (type === "image") openPanel("uploads");
        requestAnimationFrame(() =>
            document
                .querySelector(`[data-design-id="${id}"]`)
                ?.scrollIntoView({ block: "center", behavior: "smooth" }),
        );
    };
    const selectedTargetSelector =
        editing && selectionKind !== "section"
            ? `.canva-canvas [data-site-section="${editing.id}"] ${selectedElementId ? `[data-design-id="${selectedElementId}"]` : `[data-design-key="${activeDesignKey}"]`}`
            : undefined;
    const beginGeometryGesture = () => {
        if (!gestureSnapshot.current && editingRef.current)
            gestureSnapshot.current = JSON.parse(
                JSON.stringify(editingRef.current),
            );
    };
    const endGeometryGesture = () => {
        const before = gestureSnapshot.current;
        gestureSnapshot.current = null;
        if (
            before &&
            editingRef.current &&
            sectionDraftSnapshot(before) !==
                sectionDraftSnapshot(editingRef.current)
        ) {
            history.current.past.push(before);
            history.current.past = history.current.past.slice(-50);
            history.current.future = [];
            setHistoryVersion((v) => v + 1);
        }
    };
    const deleteSelection = () => {
        if (!editing || savingSection || publishing) return;
        if (activeElement) {
            revokePreview(pendingElementImages[activeElement.id]?.previewUrl);
            setPendingElementImages((current) => {
                const next = { ...current };
                delete next[activeElement.id];
                return next;
            });
            setEditing({
                ...editing,
                content: {
                    ...editing.content,
                    elements: editing.content.elements.filter(
                        (element: any) => element.id !== activeElement.id,
                    ),
                },
            });
        } else if (selectionKind === "section") {
            saveDraft(() => deleteSection(editing));
            return;
        } else updateLayout({ hidden: true });
        setSelectedElementId(null);
        setSelectionKind("section");
        setPropertyPanel(null);
    };
    const duplicateSelection = () => {
        if (!editing || savingSection || publishing) return;
        if (selectionKind === "section") {
            saveDraft(() => duplicateSection(editing));
            return;
        }
        if ((editing.content.elements || []).length >= 30) {
            setEditorClientError(
                "Choose another section or remove an element before duplicating.",
            );
            return;
        }
        const current = activeElement || {
            type:
                selectionKind === "shape"
                    ? "shape"
                    : selectionKind === "image"
                      ? "image"
                      : buttonSelected
                        ? "button"
                        : "text",
            text: activeItem
                ? activeItem[
                      activeTextField === "description"
                          ? "body"
                          : activeTextField
                  ]
                : editing.content[activeTextField],
            image:
                activeItem?.image ||
                editing.content[sectionImageContentKey] ||
                "",
            font:
                activeFormatting?.[`${activeTextField}_font`] ||
                theme.data.body_font,
            color:
                activeFormatting?.[`${activeTextField}_color`] ||
                theme.data.text,
            text_style: activeFormatting?.[`${activeTextField}_style`] || {},
            fill:
                editing.content.appearance?.decoration_color ||
                theme.data.primary,
            shape: editing.content.appearance?.decoration || "rectangle",
            href: editing.content.links?.[activeDesignKey] || "",
            layout: {
                x: 20,
                y: 55,
                width: 30,
                height: selectionKind === "text" ? 80 : 180,
                layer: 4,
            },
        };
        const id = `element-${crypto.randomUUID()}`;
        const element = {
            ...current,
            id,
            layout: {
                ...current.layout,
                x: Math.min(75, (current.layout?.x || 20) + 4),
                y: Math.min(85, (current.layout?.y || 40) + 4),
                layer: Math.min(30, (current.layout?.layer || 4) + 1),
            },
        };
        if (element.shape === "diagonal") element.shape = "rectangle";
        setEditing({
            ...editing,
            content: {
                ...editing.content,
                elements: [...(editing.content.elements || []), element],
            },
        });
        const staged = activeElement
            ? pendingElementImages[activeElement.id]
            : activeItem
              ? pendingItemImages[activeItem._editorKey]
              : pendingSectionImage;
        if (staged && element.type === "image")
            setPendingElementImages((current) => ({
                ...current,
                [id]: {
                    file: staged.file,
                    previewUrl: previewFor(staged.file),
                },
            }));
        setSelectedElementId(id);
        setActiveItemIndex(null);
        setActiveTextField("text");
    };
    const currentLink =
        activeElement?.href || editing?.content?.links?.[activeDesignKey] || "";
    const openLink = () => {
        setLinkDraft(currentLink);
        setLinkError("");
        setPropertyPanel("link");
    };
    const applyLink = (url = linkDraft) => {
        const value = url.trim();
        if (value && !isSafeStudioLink(value)) {
            setLinkError(
                "Use https://, a page path, #anchor, email address, or telephone link.",
            );
            return;
        }
        if (activeElement) updateElement({ href: value });
        else
            setEditing({
                ...editing,
                content: {
                    ...editing.content,
                    links: {
                        ...editing.content.links,
                        [activeDesignKey]: value,
                    },
                },
            });
        setLinkError("");
        setPropertyPanel(null);
    };
    const openCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!canManage || savingSection || publishing) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>(
            "[data-design-id],[data-design-key],[data-site-section]",
        );
        const section = target?.closest<HTMLElement>("[data-site-section]");
        if (!target || !section) return;
        event.preventDefault();
        event.stopPropagation();
        const id = Number(section.dataset.siteSection);
        if (target.dataset.designId)
            selectCanvasElement(id, target.dataset.designId);
        else if (target.dataset.designKey) {
            const key = target.dataset.designKey;
            const match = /^item_(\d+)_(title|description|image)$/.exec(key);
            if (key === "image" || match?.[2] === "image")
                selectCanvasImage(id, match ? Number(match[1]) : undefined);
            else if (key === "decoration") {
                const source = page.sections.find(
                    (entry: any) => entry.id === id,
                );
                if (!source) return;
                const select = () => {
                    if (editing?.id !== id) activateSection(source);
                    setActiveTextField("decoration");
                    setSelectedElementId(null);
                    setActiveItemIndex(null);
                    setSelectionKind("shape");
                };
                if (editing && editing.id !== id && editorIsDirty)
                    saveSection(editing, select);
                else select();
            } else
                selectCanvasText(
                    id,
                    match ? match[2] : key,
                    match ? Number(match[1]) : undefined,
                );
        } else {
            const source = page.sections.find((entry: any) => entry.id === id);
            if (source) openSectionEditor(source);
        }
        setContextMenu({ x: event.clientX, y: event.clientY });
    };
    const contextActions = [
        ...(selectionKind === "text"
            ? [
                  {
                      label: "Edit text",
                      onClick: () =>
                          document
                              .querySelector<HTMLElement>(
                                  selectedTargetSelector || "",
                              )
                              ?.focus(),
                  },
                  {
                      label: "Font",
                      onClick: () =>
                          document
                              .querySelector<HTMLButtonElement>(
                                  ".canva-properties-bar .text-format__font",
                              )
                              ?.click(),
                  },
                  {
                      label: "Text color",
                      onClick: () =>
                          document
                              .querySelector<HTMLButtonElement>(
                                  ".canva-properties-bar .text-format__color",
                              )
                              ?.click(),
                  },
                  {
                      label: "Text styles",
                      onClick: () =>
                          document
                              .querySelector<HTMLButtonElement>(
                                  ".canva-properties-bar button[aria-label$='style presets']",
                              )
                              ?.click(),
                  },
              ]
            : []),
        ...(selectionKind === "shape"
            ? [
                  {
                      label: "Shape design",
                      onClick: () =>
                          setPropertyPanel(
                              activeElement ? "position" : "layout",
                          ),
                  },
              ]
            : []),
        ...(selectionKind !== "section"
            ? [
                  {
                      label: currentLink ? "Edit hyperlink" : "Add hyperlink",
                      onClick: openLink,
                  },
                  {
                      label: "Size & position",
                      onClick: () => setPropertyPanel("position"),
                  },
                  {
                      label: "Bring forward",
                      onClick: () =>
                          updateLayout({
                              layer: Math.min(
                                  30,
                                  (activeLayout.layer || 0) + 1,
                              ),
                          }),
                  },
                  {
                      label: "Send backward",
                      onClick: () =>
                          updateLayout({
                              layer: Math.max(0, (activeLayout.layer || 0) - 1),
                          }),
                  },
                  {
                      label: "Align left",
                      onClick: () => updateLayout({ x: 0 }),
                  },
                  {
                      label: "Align center",
                      onClick: () =>
                          updateLayout({
                              x: Math.max(
                                  0,
                                  (100 - (activeLayout.width || 100)) / 2,
                              ),
                          }),
                  },
                  {
                      label: "Align right",
                      onClick: () =>
                          updateLayout({
                              x: Math.max(0, 100 - (activeLayout.width || 100)),
                          }),
                  },
                  { label: "Reset position & size", onClick: resetLayout },
              ]
            : [
                  {
                      label: "Section background & shapes",
                      onClick: () => setPropertyPanel("layout"),
                  },
              ]),
        ...(selectionKind === "image"
            ? [
                  {
                      label: "Replace image",
                      onClick: () => openPanel("uploads"),
                  },
                  {
                      label: "Photo design",
                      onClick: () => setPropertyPanel("image"),
                  },
              ]
            : []),
        { label: "Duplicate", onClick: duplicateSelection },
        {
            label:
                selectionKind === "section"
                    ? "Delete section"
                    : "Delete element",
            onClick: deleteSelection,
        },
        {
            label: "Undo draft edit",
            onClick: undoDraft,
            disabled: !history.current.past.length,
        },
    ];
    useEffect(() => {
        const key = (event: KeyboardEvent) => {
            if (!canManage || savingSection || publishing) return;
            const target = event.target as HTMLElement;
            const typing =
                target.isContentEditable ||
                !!target.closest("input,textarea,select");
            const command = event.ctrlKey || event.metaKey;
            if (command && event.key.toLowerCase() === "s") {
                event.preventDefault();
                saveDraft();
            } else if (
                command &&
                event.key.toLowerCase() === "k" &&
                editing &&
                selectionKind !== "section"
            ) {
                event.preventDefault();
                openLink();
            } else if (command && event.key.toLowerCase() === "z" && !typing) {
                event.preventDefault();
                event.shiftKey ? redoDraft() : undoDraft();
            } else if (command && event.key.toLowerCase() === "y" && !typing) {
                event.preventDefault();
                redoDraft();
            } else if (event.key === "Escape") {
                setContextMenu(null);
                setPropertyPanel(null);
            } else if (
                (event.key === "Delete" || event.key === "Backspace") &&
                !typing &&
                editing &&
                selectionKind !== "section"
            ) {
                event.preventDefault();
                deleteSelection();
            } else if (
                (event.key === "ContextMenu" ||
                    (event.shiftKey && event.key === "F10")) &&
                selectedTargetSelector
            ) {
                event.preventDefault();
                const box = document
                    .querySelector(selectedTargetSelector)
                    ?.getBoundingClientRect();
                if (box) setContextMenu({ x: box.left + 20, y: box.top + 20 });
            }
        };
        document.addEventListener("keydown", key);
        return () => document.removeEventListener("keydown", key);
    }, [
        editing,
        selectedElementId,
        activeDesignKey,
        savingSection,
        publishing,
        historyVersion,
    ]);
    const livePage = page
        ? {
              ...page,
              sections: page.sections.map((section: any) => {
                  if (section.id !== editing?.id) return section;
                  return {
                      ...editing,
                      content: {
                          ...editing.content,
                          ...(pendingSectionImage
                              ? {
                                    [sectionImageContentKey]:
                                        pendingSectionImage.previewUrl,
                                }
                              : {}),
                          ...(editing.content.elements
                              ? {
                                    elements: editing.content.elements.map(
                                        (element: any) => ({
                                            ...element,
                                            image:
                                                pendingElementImages[element.id]
                                                    ?.previewUrl ||
                                                element.image,
                                        }),
                                    ),
                                }
                              : {}),
                          ...(editing.content.items
                              ? {
                                    items: editing.content.items.map(
                                        (item: any) => ({
                                            ...item,
                                            image:
                                                pendingItemImages[
                                                    item._editorKey
                                                ]?.previewUrl || item.image,
                                        }),
                                    ),
                                }
                              : {}),
                      },
                  };
              }),
          }
        : null;

    return (
        <div
            className={`ns-wix-shell canva-workspace ${savingSection || publishing ? "is-saving" : ""}`}
        >
            <Head title={`Edit ${site.name}`} />
            {flash?.success && (
                <div className="flash-message success" role="status">
                    ✓ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="flash-message error" role="alert">
                    {flash.error}
                </div>
            )}

            <header className="ns-wix-topbar" aria-label="Editor command bar">
                <div className="ns-wix-topbar__left">
                    <Link
                        href={route("sites.admin", site.id)}
                        className="ns-wix-brand-button"
                        onClick={(event) => {
                            if (editorIsDirty || theme.isDirty) {
                                event.preventDefault();
                                saveDraft(() =>
                                    router.visit(route("sites.admin", site.id)),
                                );
                            }
                        }}
                        aria-label={`Back to ${site.name} overview`}
                        title="Back to website overview"
                    >
                        <StudioIcon name="back" />
                        <span className="ns-wix-brand-mark">N</span>
                    </Link>
                    <div className="ns-wix-site-name">
                        <strong>{site.name}</strong>
                        <span>Website editor</span>
                    </div>
                    <label className="ns-wix-page-picker">
                        <span className="sr-only">Current page</span>
                        <StudioIcon name="pages" />
                        <select
                            value={page?.id || ""}
                            disabled={!site.pages.length}
                            onChange={(event) => {
                                selectPage(Number(event.target.value));
                            }}
                            aria-label="Choose a page to edit"
                        >
                            {site.pages.map((candidate: any) => (
                                <option value={candidate.id} key={candidate.id}>
                                    {candidate.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="ns-wix-topbar__center">
                    <div
                        className="studio-history"
                        role="group"
                        aria-label="Draft history"
                    >
                        <button
                            type="button"
                            aria-label="Undo draft edit"
                            disabled={
                                !history.current.past.length ||
                                savingSection ||
                                publishing
                            }
                            onClick={undoDraft}
                        >
                            ↶
                        </button>
                        <button
                            type="button"
                            aria-label="Redo draft edit"
                            disabled={
                                !history.current.future.length ||
                                savingSection ||
                                publishing
                            }
                            onClick={redoDraft}
                        >
                            ↷
                        </button>
                    </div>
                    <div
                        className="ns-wix-breakpoints"
                        role="group"
                        aria-label="Preview breakpoint"
                    >
                        {(["desktop", "tablet", "mobile"] as const).map(
                            (candidate) => (
                                <button
                                    type="button"
                                    className={
                                        device === candidate ? "is-active" : ""
                                    }
                                    aria-pressed={device === candidate}
                                    aria-label={`${candidate} breakpoint`}
                                    title={`${candidate} preview`}
                                    onClick={() => setDevice(candidate)}
                                    key={candidate}
                                >
                                    <StudioIcon name={candidate} />
                                </button>
                            ),
                        )}
                    </div>
                    <div
                        className="ns-wix-zoom"
                        role="group"
                        aria-label="Canvas zoom"
                    >
                        <button
                            type="button"
                            disabled={zoom <= 50}
                            aria-label="Zoom out"
                            onClick={() => setZoom((value) => value - 10)}
                        >
                            −
                        </button>
                        <output aria-live="polite">{zoom}%</output>
                        <button
                            type="button"
                            disabled={zoom >= 100}
                            aria-label="Zoom in"
                            onClick={() => setZoom((value) => value + 10)}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="ns-wix-topbar__right">
                    <span
                        className={`ns-wix-save-state ${savingSection || theme.processing ? "is-saving" : editorIsDirty || theme.isDirty ? "is-dirty" : "is-saved"}`}
                        role="status"
                    >
                        <i aria-hidden="true" />
                        {saveState}
                    </span>
                    {canManage && (
                        <button
                            type="button"
                            className="ns-wix-command canva-save-button"
                            disabled={
                                savingSection ||
                                theme.processing ||
                                (!editorIsDirty && !theme.isDirty)
                            }
                            onClick={() => saveDraft()}
                        >
                            {savingSection || theme.processing
                                ? "Saving…"
                                : "Save changes"}
                        </button>
                    )}
                    {theme.isDirty || editorIsDirty ? (
                        <button
                            type="button"
                            className="ns-wix-command"
                            disabled
                            title="Save changes to preview"
                        >
                            <StudioIcon name="preview" />
                            Preview
                        </button>
                    ) : (
                        <a
                            className="ns-wix-command"
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <StudioIcon name="preview" />
                            Preview
                        </a>
                    )}
                    {site.status === "published" && (
                        <a
                            className="ns-wix-command ns-wix-command--quiet"
                            href={route("public.site", {
                                siteSlug: site.slug,
                            })}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Live site
                        </a>
                    )}
                    {canManage && (
                        <button
                            type="button"
                            className="ns-wix-publish"
                            disabled={
                                publishing ||
                                savingSection ||
                                theme.processing ||
                                !palettePasses
                            }
                            title={
                                theme.isDirty
                                    ? "Save design changes and publish the draft"
                                    : "Publish the current draft"
                            }
                            onClick={publishSite}
                        >
                            {publishing ? "Publishing…" : "Publish"}
                        </button>
                    )}
                </div>
            </header>

            <CanvaSelectionBar
                label={
                    activeElement
                        ? activeLabel
                        : editing
                          ? selectionKind === "text"
                              ? activeLabel
                              : selectionKind === "image"
                                ? activeItem
                                    ? `Item ${activeItemIndex! + 1} photo`
                                    : "Section image"
                                : `${editing.type} section`
                          : undefined
                }
                kind={selectionKind}
                onClear={
                    editing
                        ? () => {
                              if (editorIsDirty)
                                  saveSection(editing, () =>
                                      closeSectionEditor(true),
                                  );
                              else closeSectionEditor(true);
                          }
                        : undefined
                }
                status={saveState}
            >
                {editing && selectionKind === "text" && (
                    <TextFormattingToolbar
                        key={`${editing.id}:${selectedElementId}:${activeItemIndex}:${activeTextField}`}
                        label={activeLabel}
                        heading={
                            activeTextField === "heading" ||
                            activeTextField === "title"
                        }
                        themeFont={
                            activeTextField === "heading" ||
                            activeTextField === "title"
                                ? theme.data.heading_font
                                : theme.data.body_font
                        }
                        themeColor={
                            buttonSelected
                                ? activeTextField === "secondary_action" ||
                                  theme.data.button_style === "outline"
                                    ? theme.data.primary
                                    : readableTextColor(theme.data.primary)
                                : theme.data.text
                        }
                        value={{
                            font: activeElement
                                ? activeElement.font
                                : activeFormatting?.[`${activeTextField}_font`],
                            color: activeElement
                                ? activeElement.color
                                : activeFormatting?.[
                                      `${activeTextField}_color`
                                  ],
                            style: activeElement
                                ? activeElement.text_style
                                : activeFormatting?.[
                                      `${activeTextField}_style`
                                  ],
                        }}
                        onChange={updateFormatting}
                    />
                )}
                {editing && selectionKind !== "text" && (
                    <div className="canva-property-buttons">
                        <button
                            type="button"
                            aria-expanded={propertyPanel === "layout"}
                            onClick={() =>
                                setPropertyPanel(
                                    propertyPanel === "layout"
                                        ? null
                                        : "layout",
                                )
                            }
                        >
                            Background & shapes
                        </button>
                        <button
                            type="button"
                            aria-expanded={propertyPanel === "image"}
                            onClick={() =>
                                setPropertyPanel(
                                    propertyPanel === "image" ? null : "image",
                                )
                            }
                        >
                            Photo design
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                openPanel("uploads");
                            }}
                        >
                            Upload / replace image
                        </button>
                        {selectionKind === "section" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        saveDraft(() =>
                                            duplicateSection(editing),
                                        );
                                    }}
                                >
                                    Duplicate section
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        saveDraft(() => deleteSection(editing));
                                    }}
                                >
                                    Delete section
                                </button>
                            </>
                        )}
                    </div>
                )}
                {editing && selectionKind !== "section" && (
                    <div className="studio-property-extra">
                        <button
                            type="button"
                            aria-expanded={propertyPanel === "position"}
                            onClick={() =>
                                setPropertyPanel(
                                    propertyPanel === "position"
                                        ? null
                                        : "position",
                                )
                            }
                        >
                            Position
                        </button>
                        <button
                            type="button"
                            aria-expanded={propertyPanel === "link"}
                            onClick={openLink}
                        >
                            Link
                        </button>
                        <button
                            type="button"
                            aria-label="More selected element edits"
                            onClick={(event) => {
                                const box =
                                    event.currentTarget.getBoundingClientRect();
                                setContextMenu({
                                    x: box.left,
                                    y: box.bottom + 6,
                                });
                            }}
                        >
                            •••
                        </button>
                    </div>
                )}
                {editing && propertyPanel && (
                    <div className="canva-property-popover">
                        <button
                            type="button"
                            className="canva-close-properties"
                            aria-label="Close element settings"
                            onClick={() => setPropertyPanel(null)}
                        >
                            ×
                        </button>
                        {propertyPanel === "link" ? (
                            <div className="studio-link-controls">
                                <h3>Hyperlink</h3>
                                <p>
                                    Link this {activeLabel.toLowerCase()} to a
                                    website, page, section, email, or phone.
                                </p>
                                <label>
                                    Destination
                                    <input
                                        type="text"
                                        aria-label="Hyperlink destination"
                                        placeholder="https://example.com or /about"
                                        value={linkDraft}
                                        onChange={(event) => {
                                            setLinkDraft(event.target.value);
                                            setLinkError("");
                                        }}
                                    />
                                </label>
                                {linkError && <p role="alert">{linkError}</p>}
                                {activeElement && (
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!activeElement.new_tab}
                                            onChange={(event) =>
                                                updateElement({
                                                    new_tab:
                                                        event.target.checked,
                                                })
                                            }
                                        />{" "}
                                        Open in a new tab
                                    </label>
                                )}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => applyLink()}
                                    >
                                        Apply link
                                    </button>{" "}
                                    <button
                                        type="button"
                                        onClick={() => applyLink("")}
                                    >
                                        Remove link
                                    </button>
                                </div>
                                <p>Tip: press Ctrl/⌘ K to edit this link.</p>
                            </div>
                        ) : propertyPanel === "position" ||
                          (activeElement && propertyPanel === "image") ? (
                            <StudioElementControls
                                layout={activeLayout}
                                free={!!activeElement}
                                element={activeElement}
                                onLayout={updateLayout}
                                onElement={updateElement}
                                onReset={resetLayout}
                            />
                        ) : propertyPanel === "layout" ? (
                            <SectionAppearanceControls
                                value={editing.content.appearance}
                                themeBackground={theme.data.background}
                                themeAccent={theme.data.accent}
                                onChange={(appearance) =>
                                    setEditing({
                                        ...editing,
                                        content: {
                                            ...editing.content,
                                            appearance,
                                        },
                                    })
                                }
                            />
                        ) : (
                            <>
                                <ImageAppearanceControls
                                    value={
                                        activeItem
                                            ? activeItem.image_style
                                            : editing.content.image_style
                                    }
                                    image={selectedImage}
                                    label={
                                        activeItem
                                            ? `Item ${activeItemIndex! + 1} image`
                                            : "Section image"
                                    }
                                    background={
                                        !activeItem && editing.type === "hero"
                                    }
                                    onChange={updateImage}
                                />
                                <label>
                                    Image URL
                                    <input
                                        type="url"
                                        value={
                                            activeItem
                                                ? activeItem.image || ""
                                                : editing.content[
                                                      sectionImageContentKey
                                                  ] || ""
                                        }
                                        onChange={(event) => {
                                            if (activeItem) {
                                                clearPendingItemImage(
                                                    activeItem._editorKey,
                                                );
                                                const items = [
                                                    ...editing.content.items,
                                                ];
                                                items[activeItemIndex!] = {
                                                    ...activeItem,
                                                    image: event.target.value,
                                                };
                                                setEditing({
                                                    ...editing,
                                                    content: {
                                                        ...editing.content,
                                                        items,
                                                    },
                                                });
                                            } else {
                                                clearPendingSectionImage();
                                                setEditing({
                                                    ...editing,
                                                    content: {
                                                        ...editing.content,
                                                        [sectionImageContentKey]:
                                                            event.target.value,
                                                    },
                                                });
                                            }
                                        }}
                                    />
                                </label>
                                <label>
                                    Image description
                                    <input
                                        maxLength={180}
                                        value={
                                            activeItem
                                                ? activeItem.image_alt || ""
                                                : editing.content.image_alt ||
                                                  ""
                                        }
                                        onChange={(event) => {
                                            if (activeItem) {
                                                const items = [
                                                    ...editing.content.items,
                                                ];
                                                items[activeItemIndex!] = {
                                                    ...activeItem,
                                                    image_alt:
                                                        event.target.value,
                                                };
                                                setEditing({
                                                    ...editing,
                                                    content: {
                                                        ...editing.content,
                                                        items,
                                                    },
                                                });
                                            } else
                                                setEditing({
                                                    ...editing,
                                                    content: {
                                                        ...editing.content,
                                                        image_alt:
                                                            event.target.value,
                                                    },
                                                });
                                        }}
                                    />
                                </label>
                            </>
                        )}
                    </div>
                )}
            </CanvaSelectionBar>
            <div className="ns-wix-body">
                <nav
                    className="ns-wix-tool-rail"
                    role="tablist"
                    aria-label="Editor tools"
                    aria-orientation="vertical"
                >
                    {toolItems.map((item) => (
                        <button
                            type="button"
                            id={`studio-tab-${item.value}`}
                            role="tab"
                            aria-selected={panel === item.value}
                            aria-controls={`studio-panel-${item.value}`}
                            tabIndex={panel === item.value ? 0 : -1}
                            className={`ns-wix-tool-button ${panel === item.value ? "is-active" : ""}`}
                            title={item.label}
                            onClick={() => openPanel(item.value)}
                            onKeyDown={(event) => {
                                if (
                                    ![
                                        "ArrowUp",
                                        "ArrowDown",
                                        "Home",
                                        "End",
                                    ].includes(event.key)
                                )
                                    return;

                                event.preventDefault();
                                const buttons = Array.from(
                                    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                                        '[role="tab"]',
                                    ) || [],
                                );
                                const currentIndex = buttons.indexOf(
                                    event.currentTarget,
                                );
                                const nextIndex =
                                    event.key === "Home"
                                        ? 0
                                        : event.key === "End"
                                          ? buttons.length - 1
                                          : (currentIndex +
                                                (event.key === "ArrowDown"
                                                    ? 1
                                                    : -1) +
                                                buttons.length) %
                                            buttons.length;
                                buttons[nextIndex]?.focus();
                                buttons[nextIndex]?.click();
                            }}
                            key={item.value}
                        >
                            <StudioIcon name={item.icon} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <aside
                    className={`ns-wix-sidebar ${sidebarOpen ? "is-open" : ""}`}
                    aria-label={panelTitle}
                >
                    <header className="ns-wix-sidebar__header">
                        <div>
                            <span>Editor</span>
                            <h1>{panelTitle}</h1>
                        </div>
                        <button
                            type="button"
                            className="ns-wix-sidebar__close"
                            aria-label="Close editor panel"
                            onClick={() => setSidebarOpen(false)}
                        >
                            ×
                        </button>
                    </header>
                    <div className="ns-wix-sidebar__body">
                        {panel === "uploads" && (
                            <CanvaUploadPanel
                                selectedLabel={
                                    editing
                                        ? activeElement
                                            ? `${activeElement.type} element`
                                            : activeItem
                                              ? `Item ${activeItemIndex! + 1} photo`
                                              : `${editing.type} image`
                                        : undefined
                                }
                                currentImage={selectedImage}
                                disabled={savingSection || !canManage}
                                onUpload={(file) => {
                                    if (activeElement) {
                                        if (!validImageFile(file)) return;
                                        updateElement({ type: "image" });
                                        revokePreview(
                                            pendingElementImages[
                                                activeElement.id
                                            ]?.previewUrl,
                                        );
                                        setPendingElementImages((current) => ({
                                            ...current,
                                            [activeElement.id]: {
                                                file,
                                                previewUrl: previewFor(file),
                                            },
                                        }));
                                    } else if (activeItem)
                                        stageItemImage(
                                            activeItem._editorKey,
                                            file,
                                        );
                                    else stageSectionImage(file);
                                    setSelectionKind("image");
                                }}
                                onRemove={
                                    selectedImage
                                        ? removeSelectedImage
                                        : undefined
                                }
                            />
                        )}
                        {panel === "content" && editing && (
                            <div className="canva-details-panel">
                                <p className="eyebrow">Selected section</p>
                                <h2>
                                    {editing.content.heading || editing.type}
                                </h2>
                                <p>
                                    Click text or photos on the website. Their
                                    controls appear in the top bar.
                                </p>
                                <button
                                    type="button"
                                    className="canva-panel-button"
                                    onClick={() => {
                                        setSelectionKind("section");
                                        setActiveItemIndex(null);
                                        setPropertyPanel("layout");
                                    }}
                                >
                                    Section background & shapes
                                </button>
                                <button
                                    type="button"
                                    className="canva-panel-button"
                                    onClick={() => openPanel("uploads")}
                                >
                                    Upload an image
                                </button>
                                {editing.content.items && (
                                    <div className="canva-item-list">
                                        <h3>Cards in this section</h3>
                                        {editing.content.items.map(
                                            (item: any, index: number) => (
                                                <div key={item._editorKey}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveItemIndex(
                                                                index,
                                                            );
                                                            setActiveTextField(
                                                                "title",
                                                            );
                                                            setSelectionKind(
                                                                "text",
                                                            );
                                                        }}
                                                    >
                                                        {index + 1}.{" "}
                                                        {item.title ||
                                                            "Untitled card"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove item ${index + 1}`}
                                                        onClick={() => {
                                                            clearPendingItemImage(
                                                                item._editorKey,
                                                            );
                                                            setEditing({
                                                                ...editing,
                                                                content: {
                                                                    ...editing.content,
                                                                    ...remapItemDesignAfterDelete(
                                                                        editing.content,
                                                                        index,
                                                                    ),
                                                                    items: editing.content.items.filter(
                                                                        (
                                                                            entry: any,
                                                                        ) =>
                                                                            entry._editorKey !==
                                                                            item._editorKey,
                                                                    ),
                                                                },
                                                            });
                                                            setActiveItemIndex(
                                                                null,
                                                            );
                                                            setSelectionKind(
                                                                "section",
                                                            );
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                        <button
                                            type="button"
                                            disabled={
                                                editing.content.items.length >=
                                                12
                                            }
                                            onClick={() =>
                                                setEditing({
                                                    ...editing,
                                                    content: {
                                                        ...editing.content,
                                                        items: [
                                                            ...editing.content
                                                                .items,
                                                            {
                                                                title: "New card",
                                                                body: "Describe this card.",
                                                                image: "",
                                                                _editorKey:
                                                                    nextEditorItemKey(),
                                                            },
                                                        ],
                                                    },
                                                })
                                            }
                                        >
                                            + Add card
                                        </button>
                                    </div>
                                )}
                                {!!editing.content.elements?.length && (
                                    <div className="canva-item-list">
                                        <h3>Elements in this section</h3>
                                        {editing.content.elements.map(
                                            (element: any) => (
                                                <button
                                                    type="button"
                                                    key={element.id}
                                                    onClick={() =>
                                                        selectCanvasElement(
                                                            editing.id,
                                                            element.id,
                                                        )
                                                    }
                                                >
                                                    {element.type}:{" "}
                                                    {element.text?.slice(
                                                        0,
                                                        32,
                                                    ) ||
                                                        element.shape ||
                                                        "Image"}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                )}
                                {Object.values(
                                    editing.content.element_layouts || {},
                                ).some((layout: any) => layout?.hidden) && (
                                    <button
                                        type="button"
                                        className="canva-panel-button"
                                        onClick={() =>
                                            setEditing({
                                                ...editing,
                                                content: {
                                                    ...editing.content,
                                                    element_layouts:
                                                        Object.fromEntries(
                                                            Object.entries(
                                                                editing.content
                                                                    .element_layouts,
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]: any) => [
                                                                    key,
                                                                    {
                                                                        ...value,
                                                                        hidden: false,
                                                                    },
                                                                ],
                                                            ),
                                                        ),
                                                },
                                            })
                                        }
                                    >
                                        Restore hidden elements
                                    </button>
                                )}
                                <label className="toggle-row">
                                    <input
                                        type="checkbox"
                                        checked={editing.is_visible}
                                        onChange={(event) =>
                                            setEditing({
                                                ...editing,
                                                is_visible:
                                                    event.target.checked,
                                            })
                                        }
                                    />
                                    Visible on website
                                </label>
                            </div>
                        )}

                        {!canManage && (
                            <div className="ns-studio-readonly" role="status">
                                <b>Preview access</b>
                                <span>
                                    An owner or admin can make and publish
                                    changes.
                                </span>
                            </div>
                        )}
                        {panel === "add" && (
                            <div
                                className="ns-studio-panel ns-wix-add-panel"
                                id="studio-panel-add"
                                role="tabpanel"
                                aria-labelledby="studio-tab-add"
                            >
                                <div className="ns-studio-panel-heading">
                                    <p className="eyebrow">Build your page</p>
                                    <h2>Add elements</h2>
                                    <p>
                                        Add a hero, gallery, contact form, or
                                        another section to your page.
                                    </p>
                                </div>
                                <div className="studio-free-elements">
                                    <h3>Place an element</h3>
                                    <p>
                                        Select a section, then add and arrange
                                        elements inside it.
                                    </p>
                                    <div className="studio-free-element-buttons">
                                        {[
                                            "text",
                                            "image",
                                            "button",
                                            "shape",
                                        ].map((type) => (
                                            <button
                                                type="button"
                                                key={type}
                                                disabled={
                                                    !canManage ||
                                                    savingSection ||
                                                    publishing
                                                }
                                                onClick={() =>
                                                    addDesignElement(type)
                                                }
                                            >
                                                +{" "}
                                                {type.charAt(0).toUpperCase() +
                                                    type.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                    <div
                                        className="studio-shape-choices"
                                        role="group"
                                        aria-label="Add a shape"
                                    >
                                        {[
                                            "rectangle",
                                            "circle",
                                            "triangle",
                                            "star",
                                            "diamond",
                                            "line",
                                            "arch",
                                        ].map((shape) => (
                                            <button
                                                type="button"
                                                key={shape}
                                                disabled={
                                                    !canManage ||
                                                    savingSection ||
                                                    publishing
                                                }
                                                onClick={() =>
                                                    addDesignElement(
                                                        "shape",
                                                        shape,
                                                    )
                                                }
                                            >
                                                <i
                                                    className={`studio-shape-icon shape-${shape}`}
                                                />
                                                {shape}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {page ? (
                                    <div className="ns-wix-section-library">
                                        {sectionTypes.map((type) => (
                                            <button
                                                type="button"
                                                className={
                                                    addType === type
                                                        ? "is-selected"
                                                        : ""
                                                }
                                                disabled={!canManage}
                                                aria-pressed={addType === type}
                                                onClick={() => setAddType(type)}
                                                key={type}
                                            >
                                                <StudioIcon
                                                    name={
                                                        type === "gallery"
                                                            ? "media"
                                                            : type === "hero"
                                                              ? "hero"
                                                              : "section"
                                                    }
                                                />
                                                <span>
                                                    <b>
                                                        {type
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            type.slice(1)}
                                                    </b>
                                                    <small>
                                                        Add to {page.title}
                                                    </small>
                                                </span>
                                            </button>
                                        ))}
                                        {canManage && (
                                            <button
                                                type="button"
                                                className="button button-accent ns-wix-add-section"
                                                onClick={createSection}
                                            >
                                                + Add {addType} section
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ns-studio-empty">
                                        <p>
                                            Create a page before adding
                                            sections.
                                        </p>
                                    </div>
                                )}
                                {canManage && (
                                    <button
                                        type="button"
                                        className="button button-ghost"
                                        onClick={createPage}
                                    >
                                        + Add another page
                                    </button>
                                )}
                            </div>
                        )}

                        {panel === "layers" && (
                            <div
                                className="ns-studio-panel ns-wix-layers-panel"
                                id="studio-panel-layers"
                                role="tabpanel"
                                aria-labelledby="studio-tab-layers"
                            >
                                <div className="ns-studio-panel-heading">
                                    <p className="eyebrow">Page structure</p>
                                    <h2>{page?.title || "No page selected"}</h2>
                                    <p>
                                        Select a section to edit it or use the
                                        arrows to change its position.
                                    </p>
                                </div>
                                <div className="ns-wix-layer-list">
                                    {page?.sections?.map(
                                        (section: any, index: number) => (
                                            <div
                                                className={`ns-wix-layer-row ${selectedSectionId === section.id ? "is-selected" : ""} ${!section.is_visible ? "is-hidden" : ""}`}
                                                key={section.id}
                                            >
                                                <button
                                                    type="button"
                                                    className="ns-wix-layer-select"
                                                    aria-pressed={
                                                        selectedSectionId ===
                                                        section.id
                                                    }
                                                    onClick={() =>
                                                        openSectionEditor(
                                                            section,
                                                        )
                                                    }
                                                >
                                                    <StudioIcon name="section" />
                                                    <span>
                                                        <b>
                                                            {section.content
                                                                ?.heading ||
                                                                section.type}
                                                        </b>
                                                        <small>
                                                            {section.type}
                                                            {!section.is_visible
                                                                ? " · hidden"
                                                                : ""}
                                                        </small>
                                                    </span>
                                                </button>
                                                {canManage && (
                                                    <div className="ns-wix-layer-actions">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index === 0
                                                            }
                                                            aria-label={`Move ${section.type} section up`}
                                                            title="Move up"
                                                            onClick={() =>
                                                                move(index, -1)
                                                            }
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                page.sections
                                                                    .length -
                                                                    1
                                                            }
                                                            aria-label={`Move ${section.type} section down`}
                                                            title="Move down"
                                                            onClick={() =>
                                                                move(index, 1)
                                                            }
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                                {page && !page.sections.length && (
                                    <div className="ns-studio-empty">
                                        <p>This page has no sections yet.</p>
                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() => openPanel("add")}
                                            >
                                                Add the first section
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {panel === "pages" && (
                            <div
                                className="ns-studio-panel"
                                id="studio-panel-pages"
                                role="tabpanel"
                                aria-labelledby="studio-tab-pages"
                            >
                                <div className="sidebar-title">
                                    <span>Pages</span>
                                    {canManage && (
                                        <button
                                            type="button"
                                            aria-label="Add a page"
                                            title="Add page"
                                            onClick={createPage}
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                                {site.pages.map((p: any) => (
                                    <button
                                        type="button"
                                        className={`page-row ${page?.id === p.id ? "selected" : ""}`}
                                        aria-pressed={page?.id === p.id}
                                        onClick={() => {
                                            selectPage(p.id);
                                        }}
                                        key={p.id}
                                    >
                                        <span className="page-dot" />
                                        {p.title}
                                        <small>{p.sections.length}</small>
                                    </button>
                                ))}
                                {canManage && !site.pages.length && (
                                    <button
                                        type="button"
                                        className="button button-accent"
                                        onClick={() =>
                                            router.post(
                                                route(
                                                    "sites.generate",
                                                    site.id,
                                                ),
                                            )
                                        }
                                    >
                                        ✦ Generate with AI
                                    </button>
                                )}
                                {canManage && page && (
                                    <PageSettings
                                        key={page.id}
                                        page={page}
                                        siteId={site.id}
                                        onDeleted={() => {
                                            selectPage(
                                                site.pages.find(
                                                    (candidate: any) =>
                                                        candidate.id !==
                                                        page.id,
                                                )?.id,
                                            );
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {panel === "content" && !editing && (
                            <div
                                className="ns-studio-panel ns-wix-content-panel"
                                id="studio-panel-content"
                                role="tabpanel"
                                aria-labelledby="studio-tab-content"
                            >
                                <div className="ns-studio-panel-heading">
                                    <p className="eyebrow">Page content</p>
                                    <h2>
                                        {selectedSection
                                            ? selectedSection.content
                                                  ?.heading ||
                                              `${selectedSection.type} section`
                                            : page?.title || "No page selected"}
                                    </h2>
                                    <p>
                                        {selectedSection
                                            ? "Edit the selected section or choose another element directly on the canvas."
                                            : "Select a section on the canvas to edit its copy and images."}
                                    </p>
                                </div>
                                {selectedSection ? (
                                    <div className="ns-wix-content-summary">
                                        <span>
                                            {selectedSection.type} section
                                        </span>
                                        {selectedSection.content?.eyebrow && (
                                            <small>
                                                {
                                                    selectedSection.content
                                                        .eyebrow
                                                }
                                            </small>
                                        )}
                                        {selectedSection.content?.body && (
                                            <p>
                                                {selectedSection.content.body}
                                            </p>
                                        )}
                                        {canManage && (
                                            <button
                                                type="button"
                                                className="button button-dark"
                                                onClick={() =>
                                                    openSectionEditor(
                                                        selectedSection,
                                                    )
                                                }
                                            >
                                                Edit content
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ns-wix-content-list">
                                        {page?.sections?.map((section: any) => (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openSectionEditor(section)
                                                }
                                                key={section.id}
                                            >
                                                <span>{section.type}</span>
                                                <b>
                                                    {section.content?.heading ||
                                                        "Untitled section"}
                                                </b>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {canManage && (
                                    <button
                                        type="button"
                                        className="button button-ghost"
                                        disabled={generating}
                                        onClick={() => {
                                            if (
                                                site.pages.length &&
                                                !confirm(
                                                    "Regenerating replaces the current draft sections. Your live website stays unchanged until you publish. Continue?",
                                                )
                                            )
                                                return;
                                            setGenerating(true);
                                            router.post(
                                                route(
                                                    "sites.generate",
                                                    site.id,
                                                ),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onFinish: () =>
                                                        setGenerating(false),
                                                },
                                            );
                                        }}
                                    >
                                        {generating
                                            ? "Generating…"
                                            : "✦ Regenerate with AI"}
                                    </button>
                                )}
                            </div>
                        )}
                        {panel === "design" && canManage && (
                            <form
                                className="theme-panel ns-studio-panel"
                                id="studio-panel-design"
                                role="tabpanel"
                                aria-labelledby="studio-tab-design"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    saveTheme();
                                }}
                            >
                                <p className="eyebrow">Style preset</p>
                                <div className="theme-style-list">
                                    {Object.keys(stylePresets).map((style) => (
                                        <button
                                            type="button"
                                            key={style}
                                            className={
                                                theme.data.style === style
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                theme.setData({
                                                    ...theme.data,
                                                    ...stylePresets[style],
                                                    style,
                                                })
                                            }
                                        >
                                            <span
                                                className={`style-demo ${style}`}
                                            />
                                            <b>{style}</b>
                                            {theme.data.style === style && (
                                                <small>Selected</small>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="eyebrow">Global colours</p>
                                {[
                                    "primary",
                                    "secondary",
                                    "accent",
                                    "background",
                                    "text",
                                ].map((key) => (
                                    <label key={key}>
                                        {key}
                                        <span>
                                            <HexColorInput
                                                label={`Website ${key} color`}
                                                value={(theme.data as any)[key]}
                                                onChange={(color) => {
                                                    theme.setData(
                                                        key as any,
                                                        color,
                                                    );
                                                    if (
                                                        key === "text" ||
                                                        key === "background"
                                                    ) {
                                                        theme.clearErrors(
                                                            "text",
                                                        );
                                                    }
                                                }}
                                            />
                                            <code>
                                                {(theme.data as any)[key]}
                                            </code>
                                        </span>
                                    </label>
                                ))}
                                <div
                                    className={`theme-contrast-status ${palettePasses ? "passes" : "fails"}`}
                                    role="status"
                                >
                                    <strong>
                                        {palettePasses
                                            ? "✓ Accessible text contrast"
                                            : "! Text contrast is too low"}
                                    </strong>
                                    <span>
                                        {paletteContrast.toFixed(2)}:1 · WCAG AA
                                        requires 4.5:1
                                    </span>
                                    {theme.errors.text && (
                                        <span>{theme.errors.text}</span>
                                    )}
                                </div>
                                <p className="eyebrow">Typography & shape</p>
                                <label>
                                    Heading font
                                    <select
                                        value={theme.data.heading_font}
                                        onChange={(e) =>
                                            theme.setData(
                                                "heading_font",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {TEXT_FONTS.map((x) => (
                                            <option key={x}>{x}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Body font
                                    <select
                                        value={theme.data.body_font}
                                        onChange={(e) =>
                                            theme.setData(
                                                "body_font",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {TEXT_FONTS.map((x) => (
                                            <option key={x}>{x}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Corners
                                    <select
                                        value={theme.data.radius}
                                        onChange={(e) =>
                                            theme.setData(
                                                "radius",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {[
                                            "0px",
                                            "8px",
                                            "16px",
                                            "24px",
                                            "32px",
                                        ].map((x) => (
                                            <option key={x}>{x}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Button style
                                    <select
                                        value={theme.data.button_style}
                                        onChange={(e) =>
                                            theme.setData(
                                                "button_style",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="outline">Outline</option>
                                        <option value="rounded">Pill</option>
                                        <option value="soft">Soft</option>
                                    </select>
                                </label>
                                <label>
                                    Heading scale
                                    <select
                                        value={theme.data.heading_scale}
                                        onChange={(e) =>
                                            theme.setData(
                                                "heading_scale",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="compact">Compact</option>
                                        <option value="balanced">
                                            Balanced
                                        </option>
                                        <option value="display">Display</option>
                                    </select>
                                </label>
                                <label>
                                    Spacing
                                    <select
                                        value={theme.data.section_spacing}
                                        onChange={(e) =>
                                            theme.setData(
                                                "section_spacing",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="compact">Compact</option>
                                        <option value="comfortable">
                                            Comfortable
                                        </option>
                                        <option value="generous">
                                            Generous
                                        </option>
                                    </select>
                                </label>
                                <p className="eyebrow">Layout & navigation</p>
                                <label>
                                    Header
                                    <select
                                        value={theme.data.header_layout}
                                        onChange={(e) =>
                                            theme.setData(
                                                "header_layout",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="split">Split</option>
                                        <option value="centered">
                                            Centered
                                        </option>
                                        <option value="minimal">Minimal</option>
                                    </select>
                                </label>
                                <label>
                                    Header surface
                                    <select
                                        value={theme.data.header_style}
                                        onChange={(e) =>
                                            theme.setData(
                                                "header_style",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="glass">Glass</option>
                                        <option value="contrast">
                                            Contrast
                                        </option>
                                    </select>
                                </label>
                                <label>
                                    Footer
                                    <select
                                        value={theme.data.footer_layout}
                                        onChange={(e) =>
                                            theme.setData(
                                                "footer_layout",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="columns">Columns</option>
                                        <option value="centered">
                                            Centered
                                        </option>
                                        <option value="minimal">Minimal</option>
                                    </select>
                                </label>
                                <label>
                                    Content width
                                    <select
                                        value={theme.data.content_width}
                                        onChange={(e) =>
                                            theme.setData(
                                                "content_width",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="narrow">Narrow</option>
                                        <option value="standard">
                                            Standard
                                        </option>
                                        <option value="wide">Wide</option>
                                    </select>
                                </label>
                                <label>
                                    Hero alignment
                                    <select
                                        value={theme.data.hero_alignment}
                                        onChange={(e) =>
                                            theme.setData(
                                                "hero_alignment",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Centered</option>
                                    </select>
                                </label>
                                <label>
                                    Hero height
                                    <select
                                        value={theme.data.hero_height}
                                        onChange={(e) =>
                                            theme.setData(
                                                "hero_height",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="compact">Compact</option>
                                        <option value="standard">
                                            Standard
                                        </option>
                                        <option value="screen">
                                            Full screen
                                        </option>
                                    </select>
                                </label>
                                <p className="eyebrow">Details & effects</p>
                                <label>
                                    Card appearance
                                    <select
                                        value={theme.data.card_style}
                                        onChange={(e) =>
                                            theme.setData(
                                                "card_style",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="flat">Flat</option>
                                        <option value="bordered">
                                            Bordered
                                        </option>
                                        <option value="elevated">
                                            Elevated
                                        </option>
                                    </select>
                                </label>
                                <label>
                                    Image shape
                                    <select
                                        value={theme.data.image_shape}
                                        onChange={(e) =>
                                            theme.setData(
                                                "image_shape",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="square">Square</option>
                                        <option value="soft">
                                            Soft corners
                                        </option>
                                        <option value="rounded">Rounded</option>
                                    </select>
                                </label>
                                <label>
                                    Section dividers
                                    <select
                                        value={theme.data.divider_style}
                                        onChange={(e) =>
                                            theme.setData(
                                                "divider_style",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="none">None</option>
                                        <option value="subtle">Subtle</option>
                                        <option value="strong">Strong</option>
                                    </select>
                                </label>
                                <label>
                                    Motion
                                    <select
                                        value={theme.data.motion}
                                        onChange={(e) =>
                                            theme.setData(
                                                "motion",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="none">None</option>
                                        <option value="subtle">Subtle</option>
                                        <option value="expressive">
                                            Expressive
                                        </option>
                                    </select>
                                </label>
                                <button
                                    type="submit"
                                    className="button button-dark"
                                    disabled={
                                        theme.processing || !palettePasses
                                    }
                                >
                                    {theme.processing
                                        ? "Applying…"
                                        : "Apply entire theme"}
                                </button>
                            </form>
                        )}
                        {panel === "design" && !canManage && (
                            <div
                                className="ns-studio-panel ns-studio-summary"
                                id="studio-panel-design"
                                role="tabpanel"
                                aria-labelledby="studio-tab-design"
                            >
                                <p className="eyebrow">Current design</p>
                                <h2>{theme.data.style} style</h2>
                                <dl>
                                    <div>
                                        <dt>Heading</dt>
                                        <dd>{theme.data.heading_font}</dd>
                                    </div>
                                    <div>
                                        <dt>Body</dt>
                                        <dd>{theme.data.body_font}</dd>
                                    </div>
                                    <div>
                                        <dt>Spacing</dt>
                                        <dd>{theme.data.section_spacing}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                        {panel === "templates" && (
                            <div
                                className="ns-studio-panel"
                                id="studio-panel-templates"
                                role="tabpanel"
                                aria-labelledby="studio-tab-templates"
                            >
                                <div className="ns-studio-panel-heading">
                                    <p className="eyebrow">Design library</p>
                                    <h2>Find your website’s look</h2>
                                    <p>
                                        Start with a theme, then make it yours.
                                        Use “Design only” to keep your pages and
                                        content, or “Full layout” to rearrange
                                        the Home page. Publish when you’re
                                        ready.
                                    </p>
                                </div>
                                <label className="theme-library-search">
                                    Search {templates.length} website themes
                                    <input
                                        type="search"
                                        placeholder="Try café, wellness, store…"
                                        value={templateQuery}
                                        onChange={(event) =>
                                            setTemplateQuery(event.target.value)
                                        }
                                    />
                                </label>
                                {templates.length > 0 &&
                                    matchingTemplates.length === 0 && (
                                        <p className="section-editor-hint">
                                            No themes match. Try a business type
                                            or clear your search.
                                        </p>
                                    )}
                                <div className="ns-studio-template-list">
                                    {matchingTemplates.map((template: any) => {
                                        const isCurrent =
                                            currentTemplateId === template.id;
                                        const sectionNames = Array.isArray(
                                            template.sections,
                                        )
                                            ? template.sections
                                                  .map((section: any) =>
                                                      typeof section ===
                                                      "string"
                                                          ? section
                                                          : section?.type,
                                                  )
                                                  .filter(Boolean)
                                                  .slice(0, 5)
                                            : [];

                                        return (
                                            <article
                                                className={`ns-studio-template-card ${isCurrent ? "is-current" : ""}`}
                                                style={
                                                    {
                                                        "--ns-template-primary":
                                                            template.theme
                                                                ?.primary ||
                                                            "#0f766e",
                                                        "--ns-template-secondary":
                                                            template.theme
                                                                ?.secondary ||
                                                            "#17201e",
                                                        "--ns-template-accent":
                                                            template.theme
                                                                ?.accent ||
                                                            "#f59e0b",
                                                    } as any
                                                }
                                                key={template.id}
                                            >
                                                <div
                                                    className={`ns-studio-template-preview ns-studio-template-preview--${template.slug}`}
                                                    aria-hidden="true"
                                                >
                                                    <span />
                                                    <i />
                                                    <b />
                                                </div>
                                                <div className="ns-studio-template-copy">
                                                    <div>
                                                        <h3>{template.name}</h3>
                                                        <span>
                                                            {template.category}
                                                        </span>
                                                    </div>
                                                    {isCurrent && (
                                                        <small>Current</small>
                                                    )}
                                                </div>
                                                {sectionNames.length > 0 && (
                                                    <p>
                                                        {sectionNames.join(
                                                            " · ",
                                                        )}
                                                    </p>
                                                )}
                                                {canManage && (
                                                    <div className="ns-studio-template-actions">
                                                        <button
                                                            type="button"
                                                            className="ns-studio-card-action ns-studio-card-action-secondary"
                                                            disabled={
                                                                isCurrent ||
                                                                applyingTemplateKey !==
                                                                    null
                                                            }
                                                            onClick={() =>
                                                                applyTemplate(
                                                                    template,
                                                                    "design",
                                                                )
                                                            }
                                                        >
                                                            {isCurrent
                                                                ? "Design in use"
                                                                : applyingTemplateKey ===
                                                                    `${template.id}:design`
                                                                  ? "Restyling…"
                                                                  : "Restyle only"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="ns-studio-card-action"
                                                            disabled={
                                                                applyingTemplateKey !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                applyTemplate(
                                                                    template,
                                                                    "layout",
                                                                )
                                                            }
                                                        >
                                                            {applyingTemplateKey ===
                                                            `${template.id}:layout`
                                                                ? "Building layout…"
                                                                : isCurrent
                                                                  ? "Reapply full layout"
                                                                  : "Use full layout"}
                                                        </button>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {panel === "ai" && (
                            <div
                                className="ns-studio-panel ns-studio-ai"
                                id="studio-panel-ai"
                                role="tabpanel"
                                aria-labelledby="studio-tab-ai"
                            >
                                <div className="ns-studio-panel-heading">
                                    <p className="eyebrow">AI design partner</p>
                                    <h2>Describe the improvement</h2>
                                    <p>
                                        AI prepares a proposal first. Nothing
                                        changes until you apply it.
                                    </p>
                                </div>
                                {canManage && (
                                    <form
                                        className="ns-studio-ai-form"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            submitAiRefinement();
                                        }}
                                    >
                                        <label htmlFor="studio-ai-prompt">
                                            Your instruction
                                        </label>
                                        <textarea
                                            id="studio-ai-prompt"
                                            rows={6}
                                            minLength={10}
                                            maxLength={2000}
                                            placeholder="For example: Make this feel warmer and more premium, simplify the copy, and emphasize our local craftsmanship."
                                            value={ai.data.prompt}
                                            aria-describedby="studio-ai-prompt-help"
                                            onChange={(event) =>
                                                ai.setData(
                                                    "prompt",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <div
                                            className="ns-studio-field-meta"
                                            id="studio-ai-prompt-help"
                                        >
                                            <span>
                                                Be specific about the outcome.
                                            </span>
                                            <span>
                                                {ai.data.prompt.length}/2,000
                                            </span>
                                        </div>
                                        {ai.errors.prompt && (
                                            <p
                                                className="field-error"
                                                role="alert"
                                            >
                                                {ai.errors.prompt}
                                            </p>
                                        )}
                                        <label htmlFor="studio-ai-scope">
                                            Apply the proposal to
                                        </label>
                                        <select
                                            id="studio-ai-scope"
                                            value={ai.data.scope}
                                            onChange={(event) =>
                                                ai.setData(
                                                    "scope",
                                                    event.target
                                                        .value as AiRefinementForm["scope"],
                                                )
                                            }
                                        >
                                            <option value="site">
                                                Entire site
                                            </option>
                                            <option
                                                value="page"
                                                disabled={!page}
                                            >
                                                Current page
                                            </option>
                                            <option
                                                value="section"
                                                disabled={!selectedSection}
                                            >
                                                Selected section
                                            </option>
                                        </select>
                                        <div className="ns-studio-ai-context">
                                            {ai.data.scope === "site" ? (
                                                <span>Every editable page</span>
                                            ) : ai.data.scope === "page" ? (
                                                <span>
                                                    Page:{" "}
                                                    {page?.title || "None"}
                                                </span>
                                            ) : (
                                                <span>
                                                    Section:{" "}
                                                    {selectedSection?.type ||
                                                        "Select one on the canvas"}
                                                </span>
                                            )}
                                        </div>
                                        {(ai.errors.page_id ||
                                            ai.errors.section_id) && (
                                            <p
                                                className="field-error"
                                                role="alert"
                                            >
                                                {ai.errors.page_id ||
                                                    ai.errors.section_id}
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            className="button button-dark"
                                            disabled={
                                                ai.processing ||
                                                ai.data.prompt.trim().length <
                                                    10 ||
                                                (ai.data.scope === "page" &&
                                                    !page) ||
                                                (ai.data.scope === "section" &&
                                                    !selectedSection)
                                            }
                                        >
                                            {ai.processing
                                                ? "Preparing proposal…"
                                                : "✦ Create proposal"}
                                        </button>
                                    </form>
                                )}
                                <section
                                    className="ns-studio-proposals"
                                    aria-labelledby="studio-proposals-title"
                                >
                                    <div className="ns-studio-proposals-heading">
                                        <h3 id="studio-proposals-title">
                                            Ready to review
                                        </h3>
                                        <span>
                                            {proposedGenerations.length}
                                        </span>
                                    </div>
                                    {proposedGenerations.length ? (
                                        proposedGenerations.map(
                                            (generation: any) => (
                                                <article
                                                    className="ns-studio-proposal"
                                                    key={generation.id}
                                                >
                                                    <div>
                                                        <span>
                                                            {generation.input
                                                                ?.scope ||
                                                                generation.scope ||
                                                                "site"}
                                                        </span>
                                                        {generation.created_at && (
                                                            <time
                                                                dateTime={
                                                                    generation.created_at
                                                                }
                                                            >
                                                                {new Date(
                                                                    generation.created_at,
                                                                ).toLocaleString()}
                                                            </time>
                                                        )}
                                                    </div>
                                                    <p>
                                                        {generation.input
                                                            ?.prompt ||
                                                            generation.prompt ||
                                                            "Website improvement proposal"}
                                                    </p>
                                                    {(generation.output
                                                        ?.summary ||
                                                        generation.summary) && (
                                                        <small>
                                                            {generation.output
                                                                ?.summary ||
                                                                generation.summary}
                                                        </small>
                                                    )}
                                                    {canManage && (
                                                        <div className="ns-studio-proposal-actions">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    actingGenerationId !==
                                                                    null
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        !confirm(
                                                                            "Apply this AI proposal to your draft?",
                                                                        )
                                                                    )
                                                                        return;
                                                                    setActingGenerationId(
                                                                        generation.id,
                                                                    );
                                                                    router.post(
                                                                        route(
                                                                            "ai.refinements.apply",
                                                                            [
                                                                                site.id,
                                                                                generation.id,
                                                                            ],
                                                                        ),
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                            onFinish:
                                                                                () =>
                                                                                    setActingGenerationId(
                                                                                        null,
                                                                                    ),
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                {actingGenerationId ===
                                                                generation.id
                                                                    ? "Applying…"
                                                                    : "Apply"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="danger-link"
                                                                disabled={
                                                                    actingGenerationId !==
                                                                    null
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        !confirm(
                                                                            "Discard this AI proposal?",
                                                                        )
                                                                    )
                                                                        return;
                                                                    setActingGenerationId(
                                                                        generation.id,
                                                                    );
                                                                    router.delete(
                                                                        route(
                                                                            "ai.refinements.destroy",
                                                                            [
                                                                                site.id,
                                                                                generation.id,
                                                                            ],
                                                                        ),
                                                                        {
                                                                            preserveScroll: true,
                                                                            onFinish:
                                                                                () =>
                                                                                    setActingGenerationId(
                                                                                        null,
                                                                                    ),
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                Discard
                                                            </button>
                                                        </div>
                                                    )}
                                                </article>
                                            ),
                                        )
                                    ) : (
                                        <div className="ns-studio-empty">
                                            <span>✦</span>
                                            <p>
                                                No proposals are waiting for
                                                review.
                                            </p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                        {panel === "settings" && canManage && (
                            <div
                                id="studio-panel-settings"
                                role="tabpanel"
                                aria-labelledby="studio-tab-settings"
                            >
                                <BusinessSettings site={site} />
                            </div>
                        )}
                        {panel === "settings" && !canManage && (
                            <div
                                className="ns-studio-panel ns-studio-summary"
                                id="studio-panel-settings"
                                role="tabpanel"
                                aria-labelledby="studio-tab-settings"
                            >
                                <p className="eyebrow">Business settings</p>
                                <h2>{site.name}</h2>
                                <p>
                                    {site.description ||
                                        "No description added yet."}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
                <main
                    className="canvas-area ns-wix-workspace canva-stage"
                    aria-label="Website canvas"
                >
                    {(editorClientError || sectionEditorErrors.length > 0) && (
                        <div className="canva-workspace-error" role="alert">
                            {editorClientError && <p>{editorClientError}</p>}
                            {sectionEditorErrors.map(([field, message]) => (
                                <p key={field}>{String(message)}</p>
                            ))}
                        </div>
                    )}
                    <div
                        className="canva-canvas-wrap"
                        onContextMenu={openCanvasContextMenu}
                        style={
                            {
                                "--canva-page-width": `${canvasWidth}px`,
                                "--canva-zoom": zoom / 100,
                            } as any
                        }
                    >
                        <div
                            className="canva-canvas"
                            data-device={device}
                            style={
                                { width: canvasWidth, zoom: zoom / 100 } as any
                            }
                        >
                            {livePage ? (
                                <PublicSite
                                    site={site}
                                    theme={theme.data}
                                    page={livePage}
                                    navigation={site.pages.filter(
                                        (entry: any) =>
                                            entry.show_in_navigation,
                                    )}
                                    products={previewProducts}
                                    template={
                                        theme.data.template_slug ||
                                        site.template?.slug
                                    }
                                    isPreview
                                    editor={{
                                        enabled:
                                            canManage &&
                                            !savingSection &&
                                            !publishing,
                                        selectedSectionId,
                                        selectedField:
                                            selectionKind === "image"
                                                ? "image"
                                                : selectionKind === "text" ||
                                                    selectionKind === "shape"
                                                  ? activeTextField
                                                  : undefined,
                                        selectedItemIndex: activeItemIndex,
                                        selectedElementId,
                                        onSelectElement: selectCanvasElement,
                                        onChangeElementText: (
                                            id: number,
                                            elementId: string,
                                            text: string,
                                        ) => {
                                            if (editingRef.current?.id === id)
                                                updateElement(
                                                    { text },
                                                    elementId,
                                                );
                                        },
                                        onSelectSection: (id: number) => {
                                            const section = page.sections.find(
                                                (entry: any) => entry.id === id,
                                            );
                                            if (section)
                                                openSectionEditor(section);
                                        },
                                        onSelectText: selectCanvasText,
                                        onChangeText: updateCanvasText,
                                        onSelectImage: selectCanvasImage,
                                        onSelectDecoration:
                                            selectCanvasDecoration,
                                    }}
                                />
                            ) : (
                                <p>
                                    Add a page to start designing your website.
                                </p>
                            )}
                        </div>
                        {canManage && !savingSection && !publishing && (
                            <StudioSelectionOverlay
                                selector={selectedTargetSelector}
                                sourceKey={selectedImage}
                                layout={activeLayout}
                                free={!!activeElement}
                                revision={`${sectionDraftSnapshot(editing || { content: {} })}:${device}:${zoom}`}
                                onLayout={updateLayout}
                                onStart={beginGeometryGesture}
                                onEnd={endGeometryGesture}
                            />
                        )}
                    </div>
                </main>
            </div>

            {contextMenu && (
                <StudioContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    label={activeLabel || "Section"}
                    onClose={() => setContextMenu(null)}
                    actions={contextActions}
                />
            )}
            <footer className="ns-wix-statusbar">
                <nav className="ns-wix-breadcrumb" aria-label="Canvas location">
                    <span>{site.name}</span>
                    <i aria-hidden="true">/</i>
                    <button type="button" onClick={() => openPanel("pages")}>
                        {page?.title || "No page"}
                    </button>
                    {selectedSection && (
                        <>
                            <i aria-hidden="true">/</i>
                            <button
                                type="button"
                                onClick={() => openPanel("layers")}
                            >
                                {selectedSection.type}
                            </button>
                        </>
                    )}
                </nav>
                <div className="ns-wix-statusbar__meta">
                    <span>
                        {canManage
                            ? "Click text or images to edit · use Layers to reorder"
                            : "Read-only draft preview"}
                    </span>
                    {site.type === "store" && canManageStore && (
                        <Link href={route("commerce.hub", site.id)}>
                            Store manager
                        </Link>
                    )}
                    <span>
                        {device} · {zoom}%
                    </span>
                </div>
                <div className="canva-mobile-canvas-controls">
                    <select
                        aria-label="Canvas device preview"
                        value={device}
                        onChange={(event) =>
                            setDevice(event.target.value as StudioDevice)
                        }
                    >
                        <option value="desktop">Desktop</option>
                        <option value="tablet">Tablet</option>
                        <option value="mobile">Mobile</option>
                    </select>
                    <button
                        type="button"
                        aria-label="Zoom canvas out"
                        disabled={zoom <= 50}
                        onClick={() => setZoom((value) => value - 10)}
                    >
                        −
                    </button>
                    <output aria-live="polite">{zoom}%</output>
                    <button
                        type="button"
                        aria-label="Zoom canvas in"
                        disabled={zoom >= 100}
                        onClick={() => setZoom((value) => value + 10)}
                    >
                        +
                    </button>
                </div>
            </footer>
        </div>
    );
}

function StudioIcon({ name }: { name: StudioToolIconName }) {
    const paths: Record<StudioToolIconName, JSX.Element> = {
        add: (
            <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
            />
        ),
        ai: (
            <>
                <path
                    d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                />
                <path
                    d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"
                    fill="currentColor"
                />
            </>
        ),
        back: (
            <path
                d="m14.5 5-7 7 7 7M8 12h11"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        ),
        content: (
            <>
                <path
                    d="M5 6h14M5 10h14M5 14h9M5 18h7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </>
        ),
        delete: (
            <>
                <path
                    d="M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10 11v5M14 11v5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            </>
        ),
        design: (
            <path
                d="M12 3a9 9 0 1 0 0 18h1.5a1.7 1.7 0 0 0 0-3.4h-.8a1.4 1.4 0 0 1 0-2.8H15a6 6 0 0 0 6-6C21 5.6 17 3 12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        ),
        desktop: (
            <>
                <rect
                    x="3"
                    y="5"
                    width="18"
                    height="12"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M9 21h6M12 17v4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            </>
        ),
        duplicate: (
            <>
                <rect
                    x="8"
                    y="8"
                    width="11"
                    height="11"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
            </>
        ),
        edit: (
            <>
                <path
                    d="m4 20 4.2-1 10.6-10.6a2.12 2.12 0 0 0-3-3L5.2 16 4 20Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="m13.8 7.4 3 3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
            </>
        ),
        hero: (
            <>
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M6 16 10 12l3 3 2-2 3 3M8 8.5h.01"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),
        hide: (
            <>
                <path
                    d="M3 3l18 18M10.7 10.7a2 2 0 0 0 2.6 2.6M9.5 5.3A10.5 10.5 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-2.1 3.1M6.2 6.2C4 7.7 3 10 3 12c0 0 3.5 7 9 7 1 0 2-.2 2.8-.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),
        layers: (
            <>
                <path
                    d="m4 8 8-4 8 4-8 4-8-4Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                />
                <path
                    d="m4 12 8 4 8-4M4 16l8 4 8-4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),
        media: (
            <>
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                <path
                    d="m5 18 5-5 3 3 2-2 4 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                />
            </>
        ),
        mobile: (
            <>
                <rect
                    x="7"
                    y="2.5"
                    width="10"
                    height="19"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M11 18.5h2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            </>
        ),
        pages: (
            <>
                <path
                    d="M6 3h9l4 4v14H6V3Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                />
                <path
                    d="M15 3v5h4M9 12h7M9 16h7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        ),
        preview: (
            <>
                <path
                    d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                />
                <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
            </>
        ),
        section: (
            <>
                <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M3 9h18M8 9v11"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
            </>
        ),
        settings: (
            <>
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M19 13.5v-3l-2-.7a7 7 0 0 0-.6-1.4l.9-1.9-2.1-2.1-1.9.9a7 7 0 0 0-1.4-.6L11.2 3h-3l-.7 2a7 7 0 0 0-1.4.6l-1.9-.9-2.1 2.1.9 1.9a7 7 0 0 0-.6 1.4l-2 .7v3l2 .7a7 7 0 0 0 .6 1.4l-.9 1.9 2.1 2.1 1.9-.9a7 7 0 0 0 1.4.6l.7 2h3l.7-2a7 7 0 0 0 1.4-.6l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .6-1.4l2-.7Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(2.3) scale(.8)"
                />
            </>
        ),
        tablet: (
            <>
                <rect
                    x="5"
                    y="2.5"
                    width="14"
                    height="19"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <path
                    d="M11 18.5h2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                />
            </>
        ),
        templates: (
            <>
                <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <rect
                    x="13"
                    y="3"
                    width="8"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <rect
                    x="3"
                    y="13"
                    width="8"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
                <rect
                    x="13"
                    y="13"
                    width="8"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.7"
                />
            </>
        ),
    };

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            {paths[name]}
        </svg>
    );
}

function PageSettings({
    page,
    siteId,
    onDeleted,
}: {
    page: any;
    siteId: number;
    onDeleted: () => void;
}) {
    const form = useForm({
        title: page.title || "",
        seo_title: page.seo_title || "",
        seo_description: page.seo_description || "",
        show_in_navigation: Boolean(page.show_in_navigation),
    });
    const isHome = page.slug === "home";
    const isPublished = page.published_version !== null;

    return (
        <form
            className="ns-studio-page-settings"
            aria-labelledby={`page-settings-title-${page.id}`}
            onSubmit={(event) => {
                event.preventDefault();
                form.patch(
                    route("pages.update", { site: siteId, page: page.id }),
                    { preserveScroll: true },
                );
            }}
        >
            <div className="ns-studio-section-heading">
                <div>
                    <p className="eyebrow">Page settings</p>
                    <h2 id={`page-settings-title-${page.id}`}>{page.title}</h2>
                </div>
                <span>/{page.slug}</span>
            </div>
            <label htmlFor={`page-title-${page.id}`}>
                Page title
                <input
                    id={`page-title-${page.id}`}
                    value={form.data.title}
                    maxLength={80}
                    onChange={(event) =>
                        form.setData("title", event.target.value)
                    }
                />
            </label>
            {form.errors.title && (
                <p className="field-error" role="alert">
                    {form.errors.title}
                </p>
            )}
            <label htmlFor={`page-seo-title-${page.id}`}>
                Search title
                <input
                    id={`page-seo-title-${page.id}`}
                    value={form.data.seo_title}
                    maxLength={70}
                    placeholder="Optional title shown by search engines"
                    onChange={(event) =>
                        form.setData("seo_title", event.target.value)
                    }
                />
            </label>
            <div className="ns-studio-field-meta">
                <span>Recommended: 50–60 characters</span>
                <span>{form.data.seo_title.length}/70</span>
            </div>
            {form.errors.seo_title && (
                <p className="field-error" role="alert">
                    {form.errors.seo_title}
                </p>
            )}
            <label htmlFor={`page-seo-description-${page.id}`}>
                Search description
                <textarea
                    id={`page-seo-description-${page.id}`}
                    rows={4}
                    value={form.data.seo_description}
                    maxLength={160}
                    placeholder="Explain what visitors will find on this page"
                    onChange={(event) =>
                        form.setData("seo_description", event.target.value)
                    }
                />
            </label>
            <div className="ns-studio-field-meta">
                <span>Clear, specific and useful</span>
                <span>{form.data.seo_description.length}/160</span>
            </div>
            {form.errors.seo_description && (
                <p className="field-error" role="alert">
                    {form.errors.seo_description}
                </p>
            )}
            <label className="ns-studio-check-row">
                <input
                    type="checkbox"
                    checked={form.data.show_in_navigation}
                    onChange={(event) =>
                        form.setData("show_in_navigation", event.target.checked)
                    }
                />
                <span>
                    <b>Show in navigation</b>
                    <small>Visitors can find this page in the header.</small>
                </span>
            </label>
            <button
                type="submit"
                className="button button-dark"
                disabled={form.processing}
            >
                {form.processing ? "Saving…" : "Save page settings"}
            </button>
            {!isHome && !isPublished && (
                <button
                    type="button"
                    className="ns-studio-delete-page"
                    onClick={() => {
                        if (
                            !confirm(
                                `Delete ${page.title}? This removes its draft content and cannot be undone.`,
                            )
                        )
                            return;
                        router.delete(
                            route("pages.destroy", {
                                site: siteId,
                                page: page.id,
                            }),
                            {
                                preserveScroll: true,
                                onSuccess: onDeleted,
                            },
                        );
                    }}
                >
                    Delete page
                </button>
            )}
            {!isHome && isPublished && (
                <p className="ns-studio-page-note">
                    This page is live, so it cannot be deleted from the draft.
                    Hide it from navigation or edit and republish it.
                </p>
            )}
        </form>
    );
}
