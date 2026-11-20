export async function chooseMemory(page,id,value){
  await page.locator(`[data-memory-select="${id}"]`).click();
  const dialog=page.locator('#memoryChoiceDialog');
  await dialog.waitFor({state:'visible'});
  if(id==='memoryBook')await dialog.locator(`[data-switch="${Number(value)>38?'new':'old'}"]`).click();
  await dialog.locator(`[data-value="${value}"]`).click();
  await dialog.waitFor({state:'detached'});
}

// Intentional QA cleanup must explicitly confirm discarding unfinished test answers.
export async function closeMemory(page,{escape=false}={}){
  const dialog=page.locator('#memoryQuizDialog');
  if(escape)await page.keyboard.press('Escape');else await dialog.locator('.memory-close').click();
  const guard=page.locator('.memory-leave-confirm');
  if(await guard.isVisible())await guard.locator('.memory-leave-discard').click();
  await dialog.waitFor({state:'detached'});
}
