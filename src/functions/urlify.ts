export function urlify(title: string) {
    return title
        .replaceAll('æ', 'a')
        .replaceAll('ø', 'o')
        .replaceAll('å', 'a')
        .replaceAll('&', 'og')
        .replaceAll('&', 'og')
        .replaceAll(' ', '')
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}