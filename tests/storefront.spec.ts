import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(page:any){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(2)
}

async function campaignOpacities(page:any){
  return page.locator('.ph-campaign-media').evaluateAll((els:any[])=>els.map(el=>Number(getComputedStyle(el).opacity)))
}

test.describe('DeLù customer experience',()=>{
  test('home motion is visible, scroll-linked and leads cleanly to shop',async({page},testInfo)=>{
    const pageErrors:string[]=[]
    page.on('pageerror',error=>pageErrors.push(error.message))

    await page.goto('/')
    await expect(page.getByTestId('home-hero')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.waitForTimeout(1_750)
    await expect(page.getByTestId('intro')).toHaveCount(0)

    const heroMedia=page.locator('.ph-hero-media')
    const before=await heroMedia.evaluate(el=>getComputedStyle(el).transform)
    await page.evaluate(()=>window.scrollTo(0,Math.round(window.innerHeight*.72)))
    await page.waitForTimeout(900)
    const after=await heroMedia.evaluate(el=>getComputedStyle(el).transform)
    expect(after).not.toBe(before)

    const campaign=page.getByTestId('immersive-campaign')
    await campaign.scrollIntoViewIfNeeded()
    await page.waitForTimeout(650)
    await expect(campaign).toBeVisible()
    const sceneBefore=await campaignOpacities(page)
    await campaign.evaluate(el=>window.scrollTo(0,(el as HTMLElement).offsetTop+window.innerHeight*1.15))
    await page.waitForTimeout(900)
    const sceneAfter=await campaignOpacities(page)
    expect(Math.max(...sceneAfter)).toBeGreaterThan(.5)
    expect(sceneAfter.map(v=>v.toFixed(2)).join(',')).not.toBe(sceneBefore.map(v=>v.toFixed(2)).join(','))
    await expectNoHorizontalOverflow(page)

    const campaignTop=page.locator('.ph-campaign-top')
    const campaignBox=await campaignTop.boundingBox()
    expect(campaignBox).not.toBeNull()
    expect(campaignBox!.y).toBeGreaterThanOrEqual(testInfo.project.name.startsWith('mobile')?78:90)

    await page.screenshot({path:testInfo.outputPath('home-immersive.png'),fullPage:false})

    await page.goto('/')
    await page.waitForTimeout(1_150)
    await page.locator('.ph-head-link').click()
    await expect(page).toHaveURL(/\/shop/)
    await expect(page.getByTestId('route-transition')).toBeVisible()
    await expect(page.locator('.ds-shop-hero')).toBeVisible()
    await expect(page.locator('.ds-products .ds-product').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({path:testInfo.outputPath('shop-arrival.png'),fullPage:false})
    expect(pageErrors).toEqual([])
  })

  test('public navigation stays simple and admin is not exposed',async({page})=>{
    await page.goto('/shop')
    await expect(page.locator('.commerce-home-link')).toBeVisible()
    await expect(page.getByRole('button',{name:'Menu'})).toBeHidden()
    await expect(page.locator('.ds-mobile-menu')).toBeHidden()
    await expect(page.locator('footer a[href="/admin"]')).toBeHidden()
    await expectNoHorizontalOverflow(page)
    await page.locator('.commerce-home-link').click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('mobile cart lets the shopper continue and still reach checkout',async({page},testInfo)=>{
    test.skip(!testInfo.project.name.startsWith('mobile'),'Mobile conversion flow')
    const pageErrors:string[]=[]
    page.on('pageerror',error=>pageErrors.push(error.message))

    await page.goto('/shop')
    await expect(page.locator('.ds-product-image').first()).toBeVisible()
    await page.locator('.ds-product-image').first().click()
    await expect(page.locator('.ds-product-detail')).toBeVisible()
    await expectNoHorizontalOverflow(page)

    const sizeOptions=page.locator('.ds-option').nth(1).locator('button:not([disabled])')
    if(await sizeOptions.count())await sizeOptions.first().click()

    const add=page.locator('.ds-product-detail > .ds-pay')
    await expect(add).toBeEnabled()
    await add.click()

    await expect(page.locator('.ds-drawer')).toBeVisible()
    const continueShopping=page.getByTestId('continue-shopping')
    await expect(continueShopping).toBeVisible()
    await expect(continueShopping).toBeInViewport()
    await expect(continueShopping).toContainText(/CONTINUA|CONTINUE|CONTINUER|WEITER|SEGUIR/i)
    await page.screenshot({path:testInfo.outputPath('mobile-cart.png'),fullPage:false})
    await continueShopping.click()
    await expect(page.locator('.ds-drawer')).toHaveCount(0)

    await page.locator('.ds-cart').click()
    await expect(page.locator('.ds-drawer')).toBeVisible()
    const checkout=page.locator('.ds-cart-footer .ds-pay')
    await expect(checkout).toBeVisible()
    await expect(checkout).toBeInViewport()
    await checkout.click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('.ds-checkout')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    expect(pageErrors).toEqual([])
  })
})

test('small screens and translated headings stay inside the viewport',async({page})=>{
  for(const width of [320,390,768,1024]){
    await page.setViewportSize({width,height:800})
    await page.goto('/')
    await page.locator('.ph-language select').selectOption('de')
    await expect(page.locator('.ph-hero-title')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const bounds=await page.locator('.ph-hero-title').boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+2)
  }
})
test('reduced motion retains the hero image and all featured products',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await expect(page.locator('.ph-hero-media')).toHaveCSS('clip-path','none')
  await expect(page.locator('.ph-showcase')).toHaveCSS('height',/px/)
  await page.locator('.ph-card').last().scrollIntoViewIfNeeded()
  await expect(page.locator('.ph-card').last()).toBeInViewport()
  await expectNoHorizontalOverflow(page)
})

test('shop logo stays centered when navigation is hidden',async({page})=>{
  await page.goto('/shop')
  const logo=await page.locator('.ds-header>.ds-brand').boundingBox()
  const header=await page.locator('.ds-header').boundingBox()
  expect(logo).not.toBeNull()
  expect(Math.abs(logo!.x+logo!.width/2-(header!.x+header!.width/2))).toBeLessThan(2)
})

test('chapter navigation reaches the collection and editorial aperture responds to scroll',async({page},testInfo)=>{
  await page.goto('/')
  const chapters=page.getByRole('navigation',{name:'DeLù chapters'})
  await expect(chapters).toBeVisible()
  await expect(chapters).toBeInViewport()
  await chapters.locator('a[href="#new-icons"]').click()
  await expect(page).toHaveURL(/#new-icons$/)
  await expect(chapters.locator('a[href="#new-icons"]')).toHaveAttribute('aria-current','location')
  await expect(page.locator('.ph-showcase-title')).toBeInViewport()
  await expectNoHorizontalOverflow(page)
  await chapters.locator('a[href="#editorial"]').click()
  await expect(page).toHaveURL(/#editorial$/)
  await expect(page.locator('.ph-editorial-copy')).toBeInViewport()
  await expect(page.locator('.ph-editorial-copy h2')).toHaveCSS('opacity','1')
  await expect(page.locator('.ph-editorial-copy h2')).toHaveCSS('clip-path','none')
  const section=page.locator('.ph-editorial')
  const before=await section.evaluate(el=>getComputedStyle(el).clipPath)
  await section.evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-window.innerHeight*.8,behavior:'instant'}))
  await page.waitForTimeout(700)
  const after=await section.evaluate(el=>getComputedStyle(el).clipPath)
  expect(after).not.toBe(before)
  await expectNoHorizontalOverflow(page)
  await page.screenshot({path:testInfo.outputPath('editorial-aperture.png')})
})
test('home search opens the actual search and finds products',async({page})=>{
  await page.goto('/shop?search=1')
  await expect(page.locator('.ds-search-overlay')).toBeVisible()
  await page.locator('.ds-search-box input').fill('Blazer')
  await expect(page.locator('.ds-search-results a')).toHaveCount(1)
  await page.locator('.ds-search-results a').click()
  await expect(page).toHaveURL(/product/)
  await expect(page.locator('.ds-search-overlay')).toHaveCount(0)
})
test('chapter dock fits the narrow viewport and reduced motion removes the aperture',async({page})=>{
  await page.setViewportSize({width:320,height:740})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  const dock=page.locator('.ph-chapters')
  const bounds=await dock.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(320)
  await dock.locator('a[href="#editorial"]').click()
  await expect(page.locator('.ph-editorial')).toHaveCSS('clip-path','none')
  await expectNoHorizontalOverflow(page)
})
