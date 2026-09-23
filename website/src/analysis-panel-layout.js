export function createAnalysisPanelLayout({ mobileViewport }) {
  const heightPanel = document.querySelector('.height-control:not(.tree-health-control)');
  const treeHealthPanel = document.querySelector('.tree-health-control');
  const mapStage = document.querySelector('.map-stage');
  const mapActions = document.querySelector('.map-actions');
  const autoCollapsedAnalysisPanels = new Set();
  let lastAnalysisStageWidth = 0;
  let lastAnalysisStageHeight = 0;
  function setAnalysisPanelCollapsed(panel, collapsed) {
    panel.classList.toggle('is-desktop-collapsed', collapsed);
    panel.querySelector('.desktop-panel-collapse').setAttribute('aria-expanded', String(!collapsed));
  }
  function updateAnalysisPanelPositions(preferredPanel = null) {
    const stageWidth = mapStage.clientWidth;
    const stageHeight = mapStage.clientHeight;
    if (stageWidth !== lastAnalysisStageWidth || stageHeight !== lastAnalysisStageHeight) {
      autoCollapsedAnalysisPanels.forEach((panel) => setAnalysisPanelCollapsed(panel, false));
      autoCollapsedAnalysisPanels.clear();
      lastAnalysisStageWidth = stageWidth;
      lastAnalysisStageHeight = stageHeight;
    }
    let heightSize = heightPanel.getBoundingClientRect();
    let treeSize = treeHealthPanel.getBoundingClientRect();
    const treeRight = Math.min(74, Math.max(12, stageWidth -
      (treeHealthPanel.hidden ? heightSize.width : treeSize.width) - 12));
    const actionsRect = mapActions.getBoundingClientRect();
    const stageRect = mapStage.getBoundingClientRect();
    const stageLeft = stageRect.left;
    const topbarBottom = mapStage.querySelector('.map-topbar').getBoundingClientRect().bottom;
    const topClearance = Math.max(12, topbarBottom - stageRect.top + 12);
    const actionsLeft = actionsRect.left - stageLeft;
    const actionsRight = actionsRect.right - stageLeft;
    const overlapsActions = (right, width) => {
      const left = stageWidth - right - width;
      return left < actionsRight + 12 && stageWidth - right > actionsLeft - 12;
    };
    const besideRight = treeRight + treeSize.width + 12;
    const hasRoomBeside = !heightPanel.hidden && !treeHealthPanel.hidden &&
      stageWidth >= besideRight + heightSize.width + 8 &&
      !overlapsActions(besideRight, heightSize.width);
    const heightRight = hasRoomBeside ? besideRight : treeRight;
    const bothVisible = !heightPanel.hidden && !treeHealthPanel.hidden;
    if (hasRoomBeside) {
      autoCollapsedAnalysisPanels.forEach((panel) => setAnalysisPanelCollapsed(panel, false));
      autoCollapsedAnalysisPanels.clear();
    }
    const needsCameraClearance =
      (!treeHealthPanel.hidden && overlapsActions(treeRight, treeSize.width)) ||
      (!heightPanel.hidden && overlapsActions(heightRight, heightSize.width));
    const actionsBottom = Number.parseFloat(getComputedStyle(mapActions).bottom) || 51;
    const baseBottom = actionsBottom;
    const panelBottom = needsCameraClearance
      ? Math.max(baseBottom, actionsBottom + actionsRect.height + 12)
      : baseBottom;
    if (!mobileViewport.matches && bothVisible && !hasRoomBeside) {
      const otherPanel = preferredPanel === treeHealthPanel ? heightPanel : treeHealthPanel;
      if (panelBottom + heightSize.height + treeSize.height + 12 > stageHeight - topClearance &&
          !otherPanel.classList.contains('is-desktop-collapsed')) {
        setAnalysisPanelCollapsed(otherPanel, true);
        autoCollapsedAnalysisPanels.add(otherPanel);
        heightSize = heightPanel.getBoundingClientRect();
        treeSize = treeHealthPanel.getBoundingClientRect();
      }
      const remainingPanel = otherPanel === treeHealthPanel ? heightPanel : treeHealthPanel;
      if (panelBottom + heightSize.height + treeSize.height + 12 > stageHeight - topClearance &&
          !remainingPanel.classList.contains('is-desktop-collapsed')) {
        setAnalysisPanelCollapsed(remainingPanel, true);
        autoCollapsedAnalysisPanels.add(remainingPanel);
        heightSize = heightPanel.getBoundingClientRect();
        treeSize = treeHealthPanel.getBoundingClientRect();
      }
    }
    const heightBottom = hasRoomBeside || treeHealthPanel.hidden
      ? panelBottom
      : panelBottom + treeSize.height + 12;
    heightPanel.style.setProperty('--analysis-right', `${heightRight}px`);
    heightPanel.style.setProperty('--analysis-bottom', `${heightBottom}px`);
    treeHealthPanel.style.setProperty('--tree-health-bottom', `${panelBottom}px`);
    treeHealthPanel.style.setProperty('--tree-health-right', `${treeRight}px`);
  }
  const analysisPanelPositionObserver = new ResizeObserver(() => updateAnalysisPanelPositions());
  analysisPanelPositionObserver.observe(heightPanel);
  analysisPanelPositionObserver.observe(treeHealthPanel);
  analysisPanelPositionObserver.observe(mapStage);
  analysisPanelPositionObserver.observe(mapActions);
  updateAnalysisPanelPositions();
  function closeMobilePanels(exceptPanel = null) {
    let hasOpenPanel = false;
    document.querySelectorAll('.mobile-map-panel').forEach((panel) => {
      const keepOpen = panel === exceptPanel;
      panel.classList.toggle('is-mobile-open', keepOpen);
      panel
        .querySelector('.mobile-panel-toggle')
        ?.setAttribute('aria-expanded', String(keepOpen));
      hasOpenPanel ||= keepOpen;
    });
    document
      .querySelector('.map-stage')
      .classList.toggle('has-mobile-panel-open', hasOpenPanel);
  }

  document.querySelectorAll('.mobile-panel-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('.mobile-map-panel');
      closeMobilePanels(
        panel.classList.contains('is-mobile-open') ? null : panel,
      );
    });
  });
  document.querySelectorAll('.desktop-panel-collapse').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('.mobile-map-panel');
      const collapsed = panel.classList.toggle('is-desktop-collapsed');
      button.setAttribute('aria-expanded', String(!collapsed));
      autoCollapsedAnalysisPanels.delete(panel);
      if (panel === heightPanel || panel === treeHealthPanel) updateAnalysisPanelPositions(panel);
    });
  });
  document
    .getElementById('map')
    .addEventListener('click', () => closeMobilePanels());

  function treeVisibilityChanged(wasVisible, visible) {
    if (wasVisible !== visible) autoCollapsedAnalysisPanels.delete(treeHealthPanel);
    updateAnalysisPanelPositions();
  }

  function heightVisibilityChanged() {
    autoCollapsedAnalysisPanels.delete(heightPanel);
    updateAnalysisPanelPositions();
  }

  function selectMobilePanel(activeLayers) {
    if (!mobileViewport.matches) return;
    const selectedPanel = activeLayers.length === 1
      ? (activeLayers[0] === 'tree-health' ? treeHealthPanel : heightPanel)
      : null;
    closeMobilePanels(selectedPanel);
  }

  return { treeVisibilityChanged, heightVisibilityChanged, selectMobilePanel };
}
