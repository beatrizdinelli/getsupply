import { lazy, type ComponentType } from 'react';
import {
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

// ── Scaffold demos ────────────────────────────────────────────────────────
const AccordionDemo = lazyPage(() =>
  import('./demos/accordion').then(({ AccordionDemo }) => AccordionDemo),
);
const AlertDemo = lazyPage(() =>
  import('./demos/alert').then(({ AlertDemo }) => AlertDemo),
);
const AlertDialogDemo = lazyPage(() =>
  import('./demos/alert-dialog').then(({ AlertDialogDemo }) => AlertDialogDemo),
);
const AspectRatioDemo = lazyPage(() =>
  import('./demos/aspect-ratio').then(({ AspectRatioDemo }) => AspectRatioDemo),
);
const AvatarDemo = lazyPage(() =>
  import('./demos/avatar').then(({ AvatarDemo }) => AvatarDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const BreadcrumbDemo = lazyPage(() =>
  import('./demos/breadcrumb').then(({ BreadcrumbDemo }) => BreadcrumbDemo),
);
const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const ButtonGroupDemo = lazyPage(() =>
  import('./demos/button-group').then(({ ButtonGroupDemo }) => ButtonGroupDemo),
);
const CalendarDemo = lazyPage(() =>
  import('./demos/calendar').then(({ CalendarDemo }) => CalendarDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const CarouselDemo = lazyPage(() =>
  import('./demos/carousel').then(({ CarouselDemo }) => CarouselDemo),
);
const ChartDemo = lazyPage(() =>
  import('./demos/chart').then(({ ChartDemo }) => ChartDemo),
);
const CheckboxDemo = lazyPage(() =>
  import('./demos/checkbox').then(({ CheckboxDemo }) => CheckboxDemo),
);
const CollapsibleDemo = lazyPage(() =>
  import('./demos/collapsible').then(({ CollapsibleDemo }) => CollapsibleDemo),
);
const CommandDemo = lazyPage(() =>
  import('./demos/command').then(({ CommandDemo }) => CommandDemo),
);
const ContextMenuDemo = lazyPage(() =>
  import('./demos/context-menu').then(({ ContextMenuDemo }) => ContextMenuDemo),
);
const DialogDemo = lazyPage(() =>
  import('./demos/dialog').then(({ DialogDemo }) => DialogDemo),
);
const DrawerDemo = lazyPage(() =>
  import('./demos/drawer').then(({ DrawerDemo }) => DrawerDemo),
);
const DropdownMenuDemo = lazyPage(() =>
  import('./demos/dropdown-menu').then(
    ({ DropdownMenuDemo }) => DropdownMenuDemo,
  ),
);
const EmptyDemo = lazyPage(() =>
  import('./demos/empty').then(({ EmptyDemo }) => EmptyDemo),
);
const FieldDemo = lazyPage(() =>
  import('./demos/field').then(({ FieldDemo }) => FieldDemo),
);
const FormDemo = lazyPage(() =>
  import('./demos/form').then(({ FormDemo }) => FormDemo),
);
const HoverCardDemo = lazyPage(() =>
  import('./demos/hover-card').then(({ HoverCardDemo }) => HoverCardDemo),
);
const InputDemo = lazyPage(() =>
  import('./demos/input').then(({ InputDemo }) => InputDemo),
);
const InputGroupDemo = lazyPage(() =>
  import('./demos/input-group').then(({ InputGroupDemo }) => InputGroupDemo),
);
const InputOtpDemo = lazyPage(() =>
  import('./demos/input-otp').then(({ InputOtpDemo }) => InputOtpDemo),
);
const ItemDemo = lazyPage(() =>
  import('./demos/item').then(({ ItemDemo }) => ItemDemo),
);
const KbdDemo = lazyPage(() =>
  import('./demos/kbd').then(({ KbdDemo }) => KbdDemo),
);
const MenubarDemo = lazyPage(() =>
  import('./demos/menubar').then(({ MenubarDemo }) => MenubarDemo),
);
const NavigationMenuDemo = lazyPage(() =>
  import('./demos/navigation-menu').then(
    ({ NavigationMenuDemo }) => NavigationMenuDemo,
  ),
);
const PaginationDemo = lazyPage(() =>
  import('./demos/pagination').then(({ PaginationDemo }) => PaginationDemo),
);
const PopoverDemo = lazyPage(() =>
  import('./demos/popover').then(({ PopoverDemo }) => PopoverDemo),
);
const ProgressDemo = lazyPage(() =>
  import('./demos/progress').then(({ ProgressDemo }) => ProgressDemo),
);
const RadioGroupDemo = lazyPage(() =>
  import('./demos/radio-group').then(({ RadioGroupDemo }) => RadioGroupDemo),
);
const ResizableDemo = lazyPage(() =>
  import('./demos/resizable').then(({ ResizableDemo }) => ResizableDemo),
);
const ScrollAreaDemo = lazyPage(() =>
  import('./demos/scroll-area').then(({ ScrollAreaDemo }) => ScrollAreaDemo),
);
const SelectDemo = lazyPage(() =>
  import('./demos/select').then(({ SelectDemo }) => SelectDemo),
);
const SeparatorDemo = lazyPage(() =>
  import('./demos/separator').then(({ SeparatorDemo }) => SeparatorDemo),
);
const SheetDemo = lazyPage(() =>
  import('./demos/sheet').then(({ SheetDemo }) => SheetDemo),
);
const SidebarDemo = lazyPage(() =>
  import('./demos/sidebar').then(({ SidebarDemo }) => SidebarDemo),
);
const SkeletonDemo = lazyPage(() =>
  import('./demos/skeleton').then(({ SkeletonDemo }) => SkeletonDemo),
);
const SliderDemo = lazyPage(() =>
  import('./demos/slider').then(({ SliderDemo }) => SliderDemo),
);
const SonnerDemo = lazyPage(() =>
  import('./demos/sonner').then(({ SonnerDemo }) => SonnerDemo),
);
const SpinnerDemo = lazyPage(() =>
  import('./demos/spinner').then(({ SpinnerDemo }) => SpinnerDemo),
);
const SwitchDemo = lazyPage(() =>
  import('./demos/switch').then(({ SwitchDemo }) => SwitchDemo),
);
const TableDemo = lazyPage(() =>
  import('./demos/table').then(({ TableDemo }) => TableDemo),
);
const TabsDemo = lazyPage(() =>
  import('./demos/tabs').then(({ TabsDemo }) => TabsDemo),
);
const TextareaDemo = lazyPage(() =>
  import('./demos/textarea').then(({ TextareaDemo }) => TextareaDemo),
);
const ToastDemo = lazyPage(() =>
  import('./demos/toast').then(({ ToastDemo }) => ToastDemo),
);
const ToggleDemo = lazyPage(() =>
  import('./demos/toggle').then(({ ToggleDemo }) => ToggleDemo),
);
const ToggleGroupDemo = lazyPage(() =>
  import('./demos/toggle-group').then(({ ToggleGroupDemo }) => ToggleGroupDemo),
);
const TooltipDemo = lazyPage(() =>
  import('./demos/tooltip').then(({ TooltipDemo }) => TooltipDemo),
);

// ── GetSupply product demos ───────────────────────────────────────────────
const SupplierCardDemo = lazyPage(() =>
  import('./demos/supplier-card').then(({ SupplierCardDemo }) => SupplierCardDemo),
);
const StarRatingDemo = lazyPage(() =>
  import('./demos/star-rating').then(({ StarRatingDemo }) => StarRatingDemo),
);
const StatusBadgeDemo = lazyPage(() =>
  import('./demos/status-badge').then(({ StatusBadgeDemo }) => StatusBadgeDemo),
);
const ComparisonTableDemo = lazyPage(() =>
  import('./demos/comparison-table').then(({ ComparisonTableDemo }) => ComparisonTableDemo),
);
const NavbarDemo = lazyPage(() =>
  import('./demos/navbar').then(({ NavbarDemo }) => NavbarDemo),
);
const FileUploadDemo = lazyPage(() =>
  import('./demos/file-upload').then(({ FileUploadDemo }) => FileUploadDemo),
);

// ─────────────────────────────────────────────────────────────────────────
export type PreviewEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = {
  name: string;
  entries: PreviewEntry[];
};

export const DESIGN_SYSTEM = {
  title: 'GetSupply Design System',
  description:
    'Tokens e componentes para a plataforma B2B de sourcing de embalagens personalizadas.',
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: 'overview',
  name: 'Overview',
  description: 'Paleta, tipografia e componentes principais do GetSupply.',
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Colors',
    entries: [
      {
        id: 'color-roles',
        name: 'Color roles',
        description: 'Paleta de marca, semântica e estados de RFQ.',
        Page: ColorsPage,
      },
    ],
  },
  {
    name: 'Fonts',
    entries: [
      {
        id: 'type-scale',
        name: 'Type scale',
        description: 'Plus Jakarta Sans — display, headings, body, captions.',
        Page: FontsPage,
      },
    ],
  },
  {
    name: 'Layout',
    entries: [
      {
        id: 'spacing-radius',
        name: 'Spacing and radius',
        description: 'Escala de espaçamento e raio de borda do sistema.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'Actions',
    entries: [
      {
        id: 'button',
        name: 'Buttons',
        description: 'Primário (terracota), secundário, outline, ghost e estados.',
        Page: ButtonDemo,
      },
      {
        id: 'button-group',
        name: 'Button group',
        description: 'Ações agrupadas com separadores.',
        Page: ButtonGroupDemo,
      },
      {
        id: 'toggle',
        name: 'Toggle',
        description: 'Controles de pressionamento em múltiplas variantes.',
        Page: ToggleDemo,
      },
      {
        id: 'toggle-group',
        name: 'Toggle group',
        description: 'Seleção única e múltipla em conjuntos de toggle.',
        Page: ToggleGroupDemo,
      },
    ],
  },
  {
    name: 'Forms & inputs',
    entries: [
      {
        id: 'input',
        name: 'Input',
        description: 'Texto, e-mail, validação e estados.',
        Page: InputDemo,
      },
      {
        id: 'input-group',
        name: 'Input group',
        description: 'Inputs com addons inline e em bloco.',
        Page: InputGroupDemo,
      },
      {
        id: 'input-otp',
        name: 'Input OTP',
        description: 'Entrada segmentada de código.',
        Page: InputOtpDemo,
      },
      {
        id: 'textarea',
        name: 'Textarea',
        description: 'Entrada de texto multilinha e estados.',
        Page: TextareaDemo,
      },
      {
        id: 'file-upload',
        name: 'File upload',
        description: 'Upload com drag-and-drop, lista de arquivos e erro.',
        Page: FileUploadDemo,
      },
      {
        id: 'checkbox',
        name: 'Checkbox',
        description: 'Opções marcadas, desmarcadas e desabilitadas.',
        Page: CheckboxDemo,
      },
      {
        id: 'radio-group',
        name: 'Radio group',
        description: 'Escolhas exclusivas com labels e estados desabilitados.',
        Page: RadioGroupDemo,
      },
      {
        id: 'select',
        name: 'Select',
        description: 'Controles de seleção e opções agrupadas.',
        Page: SelectDemo,
      },
      {
        id: 'slider',
        name: 'Slider',
        description: 'Valores únicos, intervalos e estados desabilitados.',
        Page: SliderDemo,
      },
      {
        id: 'switch',
        name: 'Switch',
        description: 'Controles de preferência binária.',
        Page: SwitchDemo,
      },
      {
        id: 'calendar',
        name: 'Calendar',
        description: 'Calendário determinístico de data única.',
        Page: CalendarDemo,
      },
      {
        id: 'field',
        name: 'Field',
        description: 'Labels, descrições, erros e campos agrupados.',
        Page: FieldDemo,
      },
      {
        id: 'form',
        name: 'Form',
        description: 'Composição de formulário validado.',
        Page: FormDemo,
      },
    ],
  },
  {
    name: 'Overlays',
    entries: [
      {
        id: 'dialog',
        name: 'Dialog',
        description: 'Modal com cabeçalho, rodapé e ações.',
        Page: DialogDemo,
      },
      {
        id: 'alert-dialog',
        name: 'Alert dialog',
        description: 'Confirmação para ações consequentes.',
        Page: AlertDialogDemo,
      },
      {
        id: 'sheet',
        name: 'Sheet',
        description: 'Painéis overlay alinhados às bordas.',
        Page: SheetDemo,
      },
      {
        id: 'drawer',
        name: 'Drawer',
        description: 'Overlay inferior amigável ao toque.',
        Page: DrawerDemo,
      },
      {
        id: 'popover',
        name: 'Popover',
        description: 'Conteúdo interativo ancorado.',
        Page: PopoverDemo,
      },
      {
        id: 'hover-card',
        name: 'Hover card',
        description: 'Contexto rico revelado no hover.',
        Page: HoverCardDemo,
      },
      {
        id: 'tooltip',
        name: 'Tooltip',
        description: 'Labels breves para controles focados ou em hover.',
        Page: TooltipDemo,
      },
      {
        id: 'command',
        name: 'Command',
        description: 'Listas de comando pesquisáveis com teclado.',
        Page: CommandDemo,
      },
    ],
  },
  {
    name: 'Menus & navigation',
    entries: [
      {
        id: 'navbar',
        name: 'Navbar',
        description: 'Barra de navegação GetSupply com logo, links e CTA.',
        Page: NavbarDemo,
      },
      {
        id: 'dropdown-menu',
        name: 'Dropdown menu',
        description: 'Ações, escolhas, atalhos e submenus.',
        Page: DropdownMenuDemo,
      },
      {
        id: 'context-menu',
        name: 'Context menu',
        description: 'Ações no clique-direito e escolhas aninhadas.',
        Page: ContextMenuDemo,
      },
      {
        id: 'menubar',
        name: 'Menubar',
        description: 'Menus de aplicação estilo desktop.',
        Page: MenubarDemo,
      },
      {
        id: 'navigation-menu',
        name: 'Navigation menu',
        description: 'Navegação primária com flyouts ricos.',
        Page: NavigationMenuDemo,
      },
      {
        id: 'breadcrumb',
        name: 'Breadcrumb',
        description: 'Localização hierárquica e links pais.',
        Page: BreadcrumbDemo,
      },
      {
        id: 'pagination',
        name: 'Pagination',
        description: 'Controles de anterior, próximo e página.',
        Page: PaginationDemo,
      },
      {
        id: 'tabs',
        name: 'Tabs',
        description: 'Alternar entre visualizações de conteúdo relacionado.',
        Page: TabsDemo,
      },
      {
        id: 'sidebar',
        name: 'Sidebar',
        description: 'Navegação de aplicação delimitada.',
        Page: SidebarDemo,
      },
    ],
  },
  {
    name: 'Data display',
    entries: [
      {
        id: 'supplier-card',
        name: 'Supplier card',
        description: 'Card de fornecedor — thumbnail, categoria, estrelas, MOQ e CTA.',
        Page: SupplierCardDemo,
      },
      {
        id: 'status-badge',
        name: 'Status badge',
        description: 'Badges de status do fluxo de RFQ — 4 estados semânticos.',
        Page: StatusBadgeDemo,
      },
      {
        id: 'star-rating',
        name: 'Star rating',
        description: 'Exibição e input de avaliação em estrelas.',
        Page: StarRatingDemo,
      },
      {
        id: 'comparison-table',
        name: 'Comparison table',
        description: 'Tabela de comparação de propostas com melhor preço/prazo.',
        Page: ComparisonTableDemo,
      },
      {
        id: 'avatar',
        name: 'Avatar',
        description: 'Imagens de perfil, fallbacks e tamanhos.',
        Page: AvatarDemo,
      },
      {
        id: 'badge',
        name: 'Badge',
        description: 'Labels compactos de status e categoria.',
        Page: BadgeDemo,
      },
      {
        id: 'card',
        name: 'Card',
        description: 'Conteúdo agrupado com cabeçalho, corpo e rodapé.',
        Page: CardDemo,
      },
      {
        id: 'table',
        name: 'Table',
        description: 'Dados tabulares estruturados.',
        Page: TableDemo,
      },
      {
        id: 'accordion',
        name: 'Accordion',
        description: 'Seções expansíveis para divulgação progressiva.',
        Page: AccordionDemo,
      },
      {
        id: 'collapsible',
        name: 'Collapsible',
        description: 'Região de conteúdo expansível compacta.',
        Page: CollapsibleDemo,
      },
      {
        id: 'carousel',
        name: 'Carousel',
        description: 'Conteúdo paginado acessível por teclado.',
        Page: CarouselDemo,
      },
      {
        id: 'item',
        name: 'Item',
        description: 'Linhas flexíveis com mídia, metadados e ações.',
        Page: ItemDemo,
      },
      {
        id: 'empty',
        name: 'Empty state',
        description: 'Orientação e ações quando o conteúdo está ausente.',
        Page: EmptyDemo,
      },
      {
        id: 'kbd',
        name: 'Keyboard key',
        description: 'Atalhos de teclado individuais e agrupados.',
        Page: KbdDemo,
      },
      {
        id: 'aspect-ratio',
        name: 'Aspect ratio',
        description: 'Containers de mídia proporcionais e responsivos.',
        Page: AspectRatioDemo,
      },
    ],
  },
  {
    name: 'Feedback',
    entries: [
      {
        id: 'alert',
        name: 'Alert',
        description: 'Mensagens informativas e destrutivas.',
        Page: AlertDemo,
      },
      {
        id: 'progress',
        name: 'Progress',
        description: 'Indicadores de conclusão de trabalho em andamento.',
        Page: ProgressDemo,
      },
      {
        id: 'skeleton',
        name: 'Skeleton',
        description: 'Formas placeholder para conteúdo em carregamento.',
        Page: SkeletonDemo,
      },
      {
        id: 'spinner',
        name: 'Spinner',
        description: 'Indicadores de carregamento indeterminado.',
        Page: SpinnerDemo,
      },
      {
        id: 'toast',
        name: 'Toast',
        description: 'Notificações transitórias com provider.',
        Page: ToastDemo,
      },
      {
        id: 'sonner',
        name: 'Sonner',
        description: 'Notificações empilhadas com status e ações.',
        Page: SonnerDemo,
      },
    ],
  },
  {
    name: 'Structure',
    entries: [
      {
        id: 'separator',
        name: 'Separator',
        description: 'Divisores visuais horizontais e verticais.',
        Page: SeparatorDemo,
      },
      {
        id: 'scroll-area',
        name: 'Scroll area',
        description: 'Rolagem vertical e horizontal delimitada.',
        Page: ScrollAreaDemo,
      },
      {
        id: 'resizable',
        name: 'Resizable panels',
        description: 'Painéis divididos com handles arrastáveis.',
        Page: ResizableDemo,
      },
    ],
  },
  {
    name: 'Charts',
    entries: [
      {
        id: 'chart',
        name: 'Chart',
        description: 'Visualização de dados, tooltip e legenda.',
        Page: ChartDemo,
      },
    ],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [
  OVERVIEW_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(
      ', ',
    )}. Every page id must be unique across all nav groups.`,
  );
}
