import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.css']
})
export class TrainingComponent implements OnInit {

  readonly courses:course[] = [
    {title: 'Spring boot, il corso completo', subtitle:'Impariamo spring creando una applicazione con Spring Framework 5+, spring boot 2+, spring security, docker e altro', desc: 'Realizziamo un applicazione web completa, vedendo tutti i livelli classici, dal database al controller', technology:['Spring boot','Spring Framework','Spring data jpa','Spring Security','Caching','docker','PostgreSQL'], lang:'it',url:'https://www.udemy.com/course/spring-boot-il-corso/?couponCode=66EDB4D6D22245FC593C',coupon:'66EDB4D6D22245FC593C',lastUpdate: new Date('2020/08/15'), border:'border border-primary', photo:'assets/springCourse.webp'},
    {title: 'Youtube educational videos', subtitle:'My channel for sharing some tips and guides on different technologies', desc: '', technology:['Spring boot','docker','PostgreSQL', 'others'], lang:'eng / it',url:'https://www.youtube.com/channel/UCULYygcBWe1YBY2iLiRhUnQ/playlists',lastUpdate: new Date('2020/06/01'), border:'border border-danger', photo:'assets/logo.png'}
  ];

  constructor() { }

  ngOnInit(): void {
  }

}

 interface course {
  title: string;
  subtitle: string;
  desc: string;
  technology: string[];
  lang: string;
  url: string;
  coupon?: string;
  lastUpdate: Date;
  border: string;
  photo: string
}