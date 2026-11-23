// Exercise the same navigation controls as a user; never unhide panels in tests.
export async function openView(page,view){
 if(view==='archive'){
  await page.locator('.bottom-nav [data-go="home"]').click();
  await page.locator('[data-home-view="archive"]').click();
 }else await page.locator('.bottom-nav [data-go="'+view+'"]').click();
}
