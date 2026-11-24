// Exercise the same navigation controls as a user; never unhide panels in tests.
export async function openView(page,view){
 if(view==='archive'){
  await page.locator('.bottom-nav [data-go="home"]').click();
  await page.locator('[data-home-view="archive"]').click();
 }else await page.locator('.bottom-nav [data-go="'+view+'"]').click();
 if(view==='write'&&!await page.locator('#title').isVisible())await page.locator('#entryExtras>summary').click();
}

export async function acceptChange(page){
 await page.locator("#changeDialog").waitFor({state:"visible"});
 await page.locator("#changeConfirm").click();
}
