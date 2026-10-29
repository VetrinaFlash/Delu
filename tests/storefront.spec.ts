import { expect, test } from '@playwright/test'

test.describe('DeLù customer experience',()=>{
  test('home motion is visible, scroll-linked and leads cleanly to shop',async({page},testInfo)=>{
    await page.goto('/')
    await expect(page.getByTestId('home-hero')).toBeVisible()
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
    const firstOpacity=Number(await page.locator('.ph-campaign-media').nth(0).evaluate(el=>getComputedStyle(el).opacity))
    await campaign.evaluate(el=>window.scrollTo(0,(el as HTMLElement).offsetTop+window.innerHeight*1.25))
    await page.waitForTimeout(900)
    const secondOpacity=Number(await page.locator('.ph-campaign-media').nth(1).evaluate(el=>getComputedStyle(el).opacity))
    expect(firstOpacity).toBeGreaterThanOrEqual(0)
    expect(secondOpacity).toBeGreaterThan(.25)

    await page.screenshot({path:testInfo.outputPath('home-immersive.png'),fullPage:false})

    await page.goto('/')
    await page.waitForTimeout(1_150)
    await page.locator('.ph-head-link').click()
    await expect(page).toHaveURL(/\/shop/)
    await expect(page.getByTestId('route-transition')).toBeVisible()
    await expect(page.locator('.ds-shop-hero')).toBeVisible()
    await expect(page.locator('.ds-products .ds-product').first()).toBeVisible()
    await page.screenshot({path:testInfo.outputPath('shop-arrival.png'),fullPage:false})
  })

  test('public navigation stays simple and admin is not exposed',async({page})=>{
    await page.goto('/shop')
    await expect(page.locator('.commerce-home-link')).toBeVisible()
    await expect(page.getByRole('button',{name:'Menu'})).toBeHidden()
    await expect(page.locator('.ds-mobile-menu')).toBeHidden()
    await expect(page.locator('footer a[href="/admin"]')).toBeHidden()
    await page.locator('.commerce-home-link').click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('mobile cart lets the shopper continue and still reach checkout',async({page},testInfo)=>{
    test.skip(!testInfo.project.name.startsWith('mobile'),'Mobile conversion flow')

    await page.goto('/shop')
    await expect(page.locator('.ds-product-image').first()).toBeVisible()
    await page.locator('.ds-product-image').first().click()
    await expect(page.locator('.ds-product-detail')).toBeVisible()

    const sizeOptions=page.locator('.ds-option').nth(1).locator('button:not([disabled])')
    if(await sizeOptions.count())await sizeOptions.first().click()

    const add=page.locator('.ds-product-detail > .ds-pay')
    await expect(add).toBeEnabled()
    await add.click()

    await expect(page.locator('.ds-drawer')).toBeVisible()
    const continueShopping=page.getByTestId('continue-shopping')
    await expect(continueShopping).toBeVisible()
    await expect(continueShopping).toContainText(/CONTINUA|CONTINUE|CONTINUER|WEITER|SEGUIR/i)
    await page.screenshot({path:testInfo.outputPath('mobile-cart.png'),fullPage:false})
    await continueShopping.click()
    await expect(page.locator('.ds-drawer')).toHaveCount(0)

    await page.locator('.ds-cart').click()
    await expect(page.locator('.ds-drawer')).toBeVisible()
    const checkout=page.locator('.ds-cart-footer .ds-pay')
    await expect(checkout).toBeVisible()
    await checkout.click()
    await expect(page).toHaveURL(/\/checkout/)
    await expect(page.locator('.ds-checkout')).toBeVisible()
  })
})
