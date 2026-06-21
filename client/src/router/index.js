import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/HomePage.vue'),
    meta: { title: '首页', showNav: true }
  },
  {
    path: '/people',
    name: 'People',
    component: () => import('./pages/PeoplePage.vue'),
    meta: { title: '人物', showNav: true }
  },
  {
    path: '/people/add',
    name: 'AddPerson',
    component: () => import('./pages/AddPersonPage.vue'),
    meta: { title: '添加人物', showNav: false }
  },
  {
    path: '/people/edit/:id',
    name: 'EditPerson',
    component: () => import('./pages/EditPersonPage.vue'),
    meta: { title: '编辑人物', showNav: false }
  },
  {
    path: '/people/:id',
    name: 'PersonDetail',
    component: () => import('./pages/PersonDetailPage.vue'),
    meta: { title: '人物详情', showNav: false }
  },
  {
    path: '/anniversaries',
    name: 'Anniversaries',
    component: () => import('./pages/AnniversariesPage.vue'),
    meta: { title: '纪念', showNav: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta?.title || '人际关系管理'
  next()
})

export default router
