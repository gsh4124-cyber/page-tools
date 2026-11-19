export async function chooseMemory(page,id,value){
  await page.locator(`[data-memory-select="${id}"]`).click();
  const dialog=page.locator('#memoryChoiceDialog');
  await dialog.waitFor({state:'visible'});
  if(id==='memoryBook')await dialog.locator(`[data-switch="${Number(value)>38?'new':'old'}"]`).click();
  await dialog.locator(`[data-value="${value}"]`).click();
  await dialog.waitFor({state:'detached'});
}
