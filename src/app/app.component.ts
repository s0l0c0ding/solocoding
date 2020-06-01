import { Component } from '@angular/core';
import { SocialTagsService } from './services/social-tags.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public constructor(private tagsService: SocialTagsService) {
    this.tagsService.setTitleAndTags();

  }

}
