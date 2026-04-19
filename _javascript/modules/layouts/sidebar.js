const ATTR_DISPLAY = 'sidebar-display';
const $sidebar = document.getElementById('sidebar');
const $trigger = document.getElementById('sidebar-trigger');
const $mask = document.getElementById('mask');
const $triggerIcon = $trigger?.querySelector('i');

class SidebarUtil {
  static #isExpanded = false;

  static #renderTriggerIcon() {
    if (!$triggerIcon) return;
    $triggerIcon.classList.toggle('fa-bars', !this.#isExpanded);
    $triggerIcon.classList.toggle('fa-xmark', this.#isExpanded); // FA6
    $triggerIcon.classList.toggle('fa-times', this.#isExpanded); // FA5 호환
    $trigger.setAttribute('aria-label', this.#isExpanded ? 'Close Sidebar' : 'Sidebar');
  }

  static toggle() {
    this.#isExpanded = !this.#isExpanded;
    document.body.toggleAttribute(ATTR_DISPLAY, this.#isExpanded);
    $sidebar.classList.toggle('z-2', this.#isExpanded);
    $mask.classList.toggle('d-none', !this.#isExpanded);
  }

  static reset() {
    this.#isExpanded = false;
    document.body.removeAttribute(ATTR_DISPLAY);
    $sidebar.classList.remove('z-2');
    $mask.classList.add('d-none');
    this.#renderTriggerIcon();
  }
}

export function initSidebar() {
  $trigger.onclick = $mask.onclick = () => SidebarUtil.toggle();
  const desktop = window.matchMedia('(min-width: 992px)');
  const clearMobileSidebarState = () => {
    if (desktop.matches) {
      document.body.removeAttribute(ATTR_DISPLAY);
      $sidebar.classList.remove('z-2');
      $mask.classList.add('d-none');
    }
  };
  desktop.addEventListener('change', clearMobileSidebarState);
  clearMobileSidebarState();
}
