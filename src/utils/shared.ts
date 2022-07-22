// TODO: needs to offset for whatever the rest of the website pushes down the 
// maybe this can be properly computed by actually using refs?

export const scrollToElementAfterDelay = (element: Element, delay: number, location: ScrollLogicalPosition = 'start') => { 
  setTimeout(function() {
    element.scrollIntoView({behavior: 'smooth', block: location, inline: location});
  }, delay);
}

export const scrollToIdAfterDelay = (elementId: string, delay: number, location: ScrollLogicalPosition = 'start') => { 
  setTimeout(function() {
    document.getElementById(elementId)?.scrollIntoView({behavior: 'smooth', block: location, inline: location});
  }, delay);
}