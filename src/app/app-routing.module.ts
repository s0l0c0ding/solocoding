import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: 'blog', loadChildren: () => import('./blog/blog.module').then(m => m.BlogModule)},
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), data:{'title': "soloCoding"} },
  { path: 'about', loadChildren: () => import('./about/about.module').then(m => m.AboutModule), data:{'title': "About me", 'desc': 'I am Bassem, a management engineer, professional software developer, instructor, blogger .. whatever the role, my passions are software development and programming.'} },
  { path: 'portfolio', loadChildren: () => import('./portfolio/portfolio.module').then(m => m.PortfolioModule), data:{'title': "Portfolio", 'desc':'Here you can find my personal projects developed along the way.'} },
  { path: 'training', loadChildren: () => import('./training/training.module').then(m => m.TrainingModule), data:{'title': "Training", 'desc': 'Here you can find my latest courses, special coupons and offers.'} },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
