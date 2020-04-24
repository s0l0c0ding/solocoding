import { Component, OnInit, Input } from '@angular/core';
import { ScullyRoute } from '@scullyio/ng-lib';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {

  @Input() link:ScullyRoute
  @Input() photo:string
  cardClassArr: string[] = ['card h-100 border-secondary', 'card h-100 border-primary', 'card h-100 border-success',
  'card h-100 border-danger', 'card h-100 border-info', 'card h-100 border-dark'  ]
  cardClass: string
  constructor() {}

  ngOnInit(): void {
    this.cardClass = this.cardClassArr[Math.floor(Math.random()*this.cardClassArr.length)]
  }

}
