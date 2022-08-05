import { Component, Input } from '@angular/core';
import { ScullyRoute } from '@scullyio/ng-lib';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-amazon-affilates',
  templateUrl: './amazon-affilates.component.html',
  styleUrls: ['./amazon-affilates.component.css']
})
export class AmazonAffilatesComponent {

  @Input() post: ScullyRoute;
  @Input() badge;
  amazonLinks = environment.amazonLinks;

}
