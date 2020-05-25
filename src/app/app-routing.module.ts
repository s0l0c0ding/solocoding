import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  { path: 'blog', loadChildren: () => import('./blog/blog.module').then(m => m.BlogModule), data:{'title': "Blog"} },
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), data:{'title': "soloCoding"} },
  { path: 'about', loadChildren: () => import('./about/about.module').then(m => m.AboutModule), data:{'title': "About me"} },
  { path: 'portfolio', loadChildren: () => import('./portfolio/portfolio.module').then(m => m.PortfolioModule), data:{'title': "Portfolio"} },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
