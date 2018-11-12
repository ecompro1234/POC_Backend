# -*- encoding: utf-8 -*-
"""

"""

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from rest_framework import status

from tpath.tcpath import *
# from users.models import TblNewsFeed, TblReadBlockNews, TblUser


def _login(request, *args, **kwargs):
    if request.user.is_authenticated:
        return redirect('/account/home/')

    if request.method == 'GET':
        return render(request, TPATH_ACCOUNT_LOGIN, context={})

    content = {
        'status': 0,
        'message': 'Invalid Request',
        'response_code': status.HTTP_400_BAD_REQUEST,
        'data': []
    }

    username = request.POST['email']
    password = request.POST['password']

    if not (username and password):
        return render(request, TPATH_ACCOUNT_LOGIN, context= {
            'message' : 'Username/Password missing',
            'status':0
        })
    # validate user to be genuine
    user = authenticate(username=username, password=password)

    if not user:
        content.update({
            'message': 'Invalid Username or Password'
        })
        return render(request, TPATH_ACCOUNT_LOGIN, context= {
            'message' : 'Invalid Username/Password',
            'status':0
        })
    # creating user session
    if user is not None:
        login(request, user)
        return redirect('/account/home/')


@login_required()
def _logout(request, *args, **kwargs):
    logout(request)
    return redirect('/account/login/')


def register(request, *args, **kwargs):

    if request.method == 'GET':
        return render(request, TPATH_ACCOUNT_REGISTER, context={})

    email = request.POST['email']
    password = request.POST['password']

    if not (password and email):

        return render(request, TPATH_ACCOUNT_REGISTER, context={
            'message': 'Missing Email or Password',
            'status':0
        })

    already_exists = User.objects.filter(username=email)
    if already_exists:
        return render(request, TPATH_ACCOUNT_REGISTER, context={
            'status': 0,
            'message': 'Email Already exists.'
        })

    try:
        user = User.objects.create(username=email, email=email, is_active=True)
        user.set_password(password)
        user.save()
        return render(request, TPATH_ACCOUNT_REGISTER, context={
            'status':1,
            'message': 'Successfully created account'
        })

    except Exception as e:
        print (e)
        return render(request, TPATH_ACCOUNT_REGISTER, context={
            'status':0,
            'message': 'Please Try again.'
        })


@login_required()
def home(request, *args, **kwargs):
    return render(request, TPATH_ACCOUNT_DASHBOARD, {
    })


def forgot_password(request, *args, **kwargs):
    """

    :param request:
    :param args:
    :param kwargs:
    :return:
    """
    if request.method == 'GET':
        return render(request, TPATH_ACCOUNT_FORGET_PASSWORD, {
        })

    email = request.POST['email']
    if not email:
        return render(request, TPATH_ACCOUNT_FORGET_PASSWORD, {
            'status':0,
            'message': 'Invalid Request'
        })

    try:
        user = User.objects.get(email=email)
        # send password reset link
        return render(request, TPATH_ACCOUNT_FORGET_PASSWORD, {
            'status': 1,
            'message': 'A password reset link has been sent to your email account. Please check your email account '
                       'and reset password of your account. '
        })
    except:
        return render(request, TPATH_ACCOUNT_FORGET_PASSWORD, {
            'status': 0,
            'message': 'Sorry. No such account found. '
        })

