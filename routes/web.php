<?php

use App\Http\Controllers\BuilderController;
use App\Http\Controllers\CommerceHubController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicSiteController;
use App\Http\Controllers\SiteAdminController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SiteDraftPreviewController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
    ]);
});
Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');

Route::get('/dashboard', [SiteController::class, 'dashboard'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/sites/create', [SiteController::class, 'create'])->name('sites.create');
    Route::post('/sites', [SiteController::class, 'store'])->name('sites.store');
    Route::get('/sites/{site}/admin', [SiteAdminController::class, 'show'])->name('sites.admin');
    Route::get('/sites/{site}/edit', [SiteController::class, 'edit'])->name('sites.edit');
    Route::get('/sites/{site}/preview-shop', [SiteDraftPreviewController::class, 'shop'])->name('sites.preview.shop');
    Route::get('/sites/{site}/preview-product/{productSlug}', [SiteDraftPreviewController::class, 'product'])->name('sites.preview.product');
    Route::get('/sites/{site}/preview/{pageSlug?}', [SiteDraftPreviewController::class, 'show'])->name('sites.preview');
    Route::patch('/sites/{site}', [SiteController::class, 'update'])->name('sites.update');
    Route::post('/sites/{site}/logo', [SiteController::class, 'uploadLogo'])->name('sites.logo');
    Route::post('/sites/{site}/generate', [BuilderController::class, 'generate'])->name('sites.generate');
    Route::post('/sites/{site}/pages', [BuilderController::class, 'storePage'])->name('pages.store');
    Route::patch('/sites/{site}/pages/{page}', [BuilderController::class, 'updatePage'])->name('pages.update');
    Route::delete('/sites/{site}/pages/{page}', [BuilderController::class, 'destroyPage'])->name('pages.destroy');
    Route::patch('/sites/{site}/sections/{section}', [BuilderController::class, 'updateSection'])->name('sections.update');
    Route::post('/sites/{site}/sections/{section}/image', [BuilderController::class, 'uploadSectionImage'])->name('sections.image');
    Route::post('/sites/{site}/pages/{page}/sections', [BuilderController::class, 'storeSection'])->name('sections.store');
    Route::post('/sites/{site}/sections/{section}/duplicate', [BuilderController::class, 'duplicateSection'])->name('sections.duplicate');
    Route::delete('/sites/{site}/sections/{section}', [BuilderController::class, 'destroySection'])->name('sections.destroy');
    Route::patch('/sites/{site}/pages/{page}/sections/reorder', [BuilderController::class, 'reorderSections'])->name('sections.reorder');
    Route::patch('/sites/{site}/theme', [BuilderController::class, 'updateTheme'])->name('themes.update');
    Route::post('/sites/{site}/template', [BuilderController::class, 'applyTemplate'])->name('templates.apply');
    Route::post('/sites/{site}/ai-refinements', [BuilderController::class, 'createAiRefinement'])->middleware('throttle:10,1')->name('ai.refinements.store');
    Route::post('/sites/{site}/ai-refinements/{generation}/apply', [BuilderController::class, 'applyAiRefinement'])->middleware('throttle:10,1')->name('ai.refinements.apply');
    Route::delete('/sites/{site}/ai-refinements/{generation}', [BuilderController::class, 'destroyAiRefinement'])->name('ai.refinements.destroy');
    Route::post('/sites/{site}/publish', [BuilderController::class, 'publish'])->name('sites.publish');
    Route::get('/sites/{site}/commerce', [CommerceHubController::class, 'show'])->name('commerce.hub');
    Route::get('/sites/{site}/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/sites/{site}/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::patch('/sites/{site}/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
    Route::get('/sites/{site}/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/sites/{site}/products', [ProductController::class, 'store'])->name('products.store');
    Route::get('/sites/{site}/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::patch('/sites/{site}/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/sites/{site}/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/s/{siteSlug}/shop', [StorefrontController::class, 'shop'])->name('storefront.shop');
Route::get('/s/{siteSlug}/product/{productSlug}', [StorefrontController::class, 'product'])->name('storefront.product');
Route::post('/s/{siteSlug}/cart/{product}', [StorefrontController::class, 'add'])->name('storefront.cart.add');
Route::get('/s/{siteSlug}/cart', [StorefrontController::class, 'cart'])->name('storefront.cart');
Route::patch('/s/{siteSlug}/cart/{product}', [StorefrontController::class, 'updateCart'])->name('storefront.cart.update');
Route::get('/s/{siteSlug}/checkout', [StorefrontController::class, 'checkout'])->name('storefront.checkout');
Route::post('/s/{siteSlug}/checkout', [StorefrontController::class, 'placeOrder'])->middleware('throttle:10,1')->name('storefront.order');
Route::get('/s/{siteSlug}/order/{number}', [StorefrontController::class, 'confirmation'])->name('storefront.confirmation');
Route::get('/s/{siteSlug}/{pageSlug?}', [PublicSiteController::class, 'show'])->name('public.site');
