"""fecgov URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from .views_cluster.login import (_login, register,
                                  home, _logout, forgot_password
                                  )

urlpatterns = [
    url(r'^login/', _login, name='login'),
    url(r'^home/', home, name='home'),
    url(r'^register/', register, name='register'),
    url(r'^logout/', _logout, name='logout'),
    url(r'^forgot-password/', forgot_password, name='forgot-password'),


]
