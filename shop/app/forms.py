from django import forms
from django.contrib.auth.forms import SetPasswordForm
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import ugettext as _
from django.contrib.auth.models import User
from django.forms import ModelForm
from django.contrib.auth.models import Group
from app.models import *

class AdminUserForm(forms.Form):
    first_name = forms.CharField(widget=forms.TextInput(attrs={'class':'mdl-textfield__input','id':'CompanyName',"placeholder":"First name"}), max_length=25)
    last_name = forms.CharField(widget=forms.TextInput(attrs={'class':'mdl-textfield__input','id':'adminInputLastName',"placeholder":"Last name"}),label=_(u'Last Name'), max_length=25, error_messages={'required': _(u'Enter a last name.')})
    email = forms.EmailField(widget=forms.TextInput(attrs={'class':'form-control col-sm-12','id':'email',"placeholder":"Email(username)"}),label=_(u'email'),max_length=75, error_messages={'required': _(u'Enter a email address')})
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class':'form-control col-sm-12','id':'pass',"placeholder":"Password"}), min_length=8, max_length=30, error_messages={'required': _(u'Choose a password.')})

    def clean_email(self):
        email = self.cleaned_data.get('email', None)
        if User.objects.filter(email=email, username=email):
            raise forms.ValidationError(_(u'Already exist. Try another'))
        return email

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if len(password) < 8:
            raise forms.ValidationError('Password too short')
        return password

##    @transaction.commit_on_success
    def save(self,request):
        password = self.cleaned_data['password']
        email = self.cleaned_data['email']
        user = User.objects.create_superuser(email, email, password)
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.is_active = 0
        user.is_staff = 0
        user.save()

        return user
