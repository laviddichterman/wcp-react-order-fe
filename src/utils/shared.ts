// TODO: needs to offset for whatever the rest of the website pushes down the 
// maybe this can be properly computed by actually using refs?

export const scrollToElementAfterDelay = (element: Element, delay: number, location: ScrollLogicalPosition) => { 
  setTimeout(function() {
    element.scrollIntoView({behavior: 'smooth', block: location, inline: location});
  }, delay);
}

export const scrollToElementOffsetAfterDelay = (element: Element, delay: number, location: 'start' | 'center', offsetY: number = 0) => { 
  setTimeout(function() {
      const bbox = element.getBoundingClientRect();
      let loc = (location === 'start' ? bbox.top : ((bbox.top + bbox.bottom) / 2) ) + offsetY;
      console.log(`${element.nodeName} has bbox of ${JSON.stringify(bbox)}, scrolling to ${loc}`);
      window.scrollTo({behavior: 'smooth', top: loc});
    }, delay);
}

export const scrollToIdAfterDelay = (elementId: string, delay: number, location: ScrollLogicalPosition = 'start') => { 
  console.log(`scrollin to... ${elementId}`)
  setTimeout(function() {
    console.log(`${elementId} has bbox of ${JSON.stringify(document.getElementById(elementId)?.getBoundingClientRect())}`)
    document.getElementById(elementId)?.scrollIntoView({behavior: 'smooth', block: location, inline: location});
  }, delay);
}


export const scrollToIdOffsetAfterDelay = (elementId: string, delay: number, offsetY: number = 0) => { 
  console.log(`scrollin to... ${elementId}`)
  setTimeout(function() {
    const foundElement = document.getElementById(elementId);
    if (foundElement) {
      const bbox = foundElement.getBoundingClientRect();
      const loc = bbox.top + offsetY;
      console.log(`${elementId} has bbox of ${JSON.stringify(foundElement.getBoundingClientRect())}, scrolling to ${loc}`);
      console.log(`some window info: scrolly ${window.scrollY}, parent top: ${window.top?.screenTop} vs current top: ${window.screenTop}`)

      window.scrollTo({ behavior: 'smooth', top: loc }); 
    }
  }, delay);
}