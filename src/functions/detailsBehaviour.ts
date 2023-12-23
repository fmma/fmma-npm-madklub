
export const detailsClick = (e: Event) => {
    const path = e.composedPath();
    const summary = path[0] as HTMLElement;
    const details = path[1] as HTMLDetailsElement;
    if (!(summary.tagName === 'SUMMARY' && details instanceof HTMLDetailsElement)) {
        return;
    }
    if (details.open)
        return true;

    for (const d of document.body.querySelectorAll('details')) {
        if (d !== details)
            d.open = false;
    }
    setTimeout(() => details.querySelector('div')?.scrollIntoView({ behavior: 'smooth' }));
}