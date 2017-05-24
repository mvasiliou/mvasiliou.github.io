---
layout: post
title:  "Using the Django-Rest-Framework to Set Up an API"
date:   2017-05-23 17:46:37 -0500
categories: jekyll update
---

In Django you can easily define your data schemas in a models.py file. After
defining your models, you can apply them to your database by running 
"python manage.py makemigrations" then running "python manage.py migrate."

Let's say we're working on an app to store information on vehicles. Then we might
define a Vehicle class in our models.py file like so:

{% highlight python %}
class Employee(models.Model):
    year = models.IntegerField(null = False)
    owner = models.CharField(null = False, max_length = 250)
    brand = models.CharField(null = False, max_length=250)    
    model = models.CharField(null = False, max_length=250)
{% endhighlight %}

For the rest of this post, we'll assume that we're working off of this model, which
is placed in a Django app called "api".

After that you can take your models anywhere in your webapp and filter on 
specific attributes, create new instances or update old ones. 

Django also allows you to pass your data models to the front end, by adding
an instance or queryset to your views:

{% highlight python %}
def index(request):
    vehicles = Vehicle.objects.all()
    context = {'vehicles': vehicles}
    return render(request, 'ui/index.html', context)
{% endhighlight %}

You can then access the passed variable from within your template. But what if 
you're not relying on the Django template system? Or what if you want to load 
data without refreshing the page? While Django's templating system is 
easy to setup, it doesn't have the flexibility to transfer data on the fly. 

One solution is to set-up a unique view to pass data via an AJAX call to a full
page. Say we want to create a Vehicle object on the front-end by sending data to
the back-end over AJAX. We might write a view like below:

{% highlight python %}
def create_vehicle(request):
    if request.method == 'POST':
        vehicle = Vehicle()
        
        vehicle.year = request.POST.get('year')
        vehicle.owner = request.POST.get('owner')
        vehicle.brand = request.POST.get('brand')
        vehicle.model = request.POST.get('model')
        vehicle.save()

        response_data = {}
        response_data['vehicle_id'] = vehicle.pk
        response_data['owner'] = vehicle.owner
        response_data['brand'] = vehicle.brand
        response_data['model'] = vehicle.model

        return JsonResponse(
            response_data,
            content_type="application/json"
        )
    else:
        return JsonResponse(
            json.dumps({"": ""}),
            content_type="application/json"
        )
{% endhighlight %}
Then, we need to define a place to access this view in our urls.py file:

{% highlight python %}
from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^create_vehicle/$', views.create_vehicle, name = 'create'),
    url(r'^update_vehicle/(?P<vehicle_id>[-\w]+)/$', views.update_vehicle, name = 'update'),
    url(r'^delete_vehicle/(?P<vehicle_id>[-\w]+)/$', views.delete_vehicle, name = 'delete'),
]
{% endhighlight %}

But this is....messy and repetive code. We'd need to write a similar view for each
type of data and for other actions, like deleting or updating. Then, we'd need
to define another URL for each one of **those** views. Messy and repetitive code
is just not beautiful or pythonic, so we want to avoid it as much as possible. 

Enter the Django REST Framework. This library allows us our front-end application to
call out to defined urls on our backend and seamlessly receive data back in JSON format.
Best of all, we don't need to define individual URLs or views for specific actions.
Instead, we write a single view for each model in our data set and only need two
urls. All the heavy lifting of figuring out how to respond to our request is 
handled by the framework!


Let's start by installing the package from the command line:

```
$ pip install djangorestframework
```

You also need to add the package to your `INSTALLED_PACKAGES` in your settings.py
file. 

{% highlight python %}
INSTALLED_APPS = (
    ...
    'rest_framework',
)
{% endhighlight %}

This would also be a great time to add `djangorestframework` to your requirements.txt 
file!

The nice thing about the Django REST Framework is we don't need to change how our
data is stored at all, so write your models.py file as you normally would and we never
touch it again!

We are going to create a new type of file though, called serializers.py. This file
will define the fields that we expose to the front-end of the application through our API
and the types of actions that we can then execute. This file belongs in the 
same app directory as the matching models.py file. First, we'll start
by importing our models and some modules from the `rest_framework`:

{% highlight python %}
from .models import Employee, Office, Department, TradingTeam
from rest_framework import serializers
{% endhighlight %}

Then, we'll write a serializer class for each model in our data structure. We
use the `serializers.HyperlinkedModelSerializer` as a parent class as it allows
us to include data from connected models within the JSON output of the API.

{% highlight python %}
class VehicleSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.ReadOnlyField()

    class Meta:
        model = Vehicle
        fields = ('id', 'owner', 'brand', 'model', 'year')
{% endhighlight %}

In the fields section at the bottom, we list each attribute from the model we want
to include in our output to the front-end. What if we wanted to exclude an attribute?
Feel free! If we wanted to the `owner` field to be hidden from the front-end, we
could just leave it out of our fields section and it never gets passed.

What's with the `id = serializers.ReadOnlyField()` line? This line allows us to pass
along the primary key of the model to the front-end, but does not allow changes
to be made the primary key of a model. We could also block reads to the front-end
for other fields as well if we liked.

What if we had a relationship between this instance and another? Let's say that
the `owner` field is actually a `ForeignKey` to an Owner model. Let's define our
Owner class below:

{% highlight python %}
class Owner(models.Model):
    first_name = models.CharField(null = False, max_length = 250)
    last_name = models.CharField(null = False, max_length = 250)

    def __str__(self):
        return self.first_name + ' ' + self.last_name
{% endhighlight %}


Then, we could define a second serializer for the Owner class in our serializers.py
file and *then* include a reference to the other serializer in our Vehicle class. 
Let's update our serializers.py file:

{% highlight python %}
class OwnerSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.ReadOnlyField()

    class Meta:
        model = Owner
        fields = ('id', 'first_name', 'last_name')

class VehicleSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.ReadOnlyField()
    owner = OwnerSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=Owner.objects.all(), source='owner', write_only=True)

    class Meta:
        model = FirmPeriod
        fields = ('id', 'owner', 'year', 'brand', 'model',)
{% endhighlight %}

Something to take note of here: we defined fields for the owner TWICE! Why?
The first one `owner` is read-only and delivers all of the information about
the Owner nested with in the JSON output of the Vehicle. The `owner_id` field never
appears in the output, it's just for receving requests. Since `owner` is delivering
all of the information about the Owner, it also expects all of that information
back when we make updates. But we don't necessarily want to do that: we just want to 
update the *key* referenced in Vehicle to a different Owner. That's what `owner_id`
does, it just looks for an id, not the full information about an Owner. 

If we **don't** want to send the full information on the Owner in each output,
then we can use just one field to send just the primary key like so:

{% highlight python %}
class VehicleSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField()
    owner = serializers.PrimaryKeyRelatedField(
        queryset=Owner.objects.all(), source='owner')

    class Meta:
        model = FirmPeriod
        fields = ('id', 'owner', 'year', 'brand', 'model',)
{% endhighlight %}

Note that we changed `HyperlinkedModelSerializer`, to just `ModelSerializer`.
We didn't have to do that, it would have worked just fine with the hyperlinked version,
but since we aren't nesting our models, we really only need the `ModelSerializer`
parent class. 

Some, quick final points before we move on:

- Make sure you import all of the models you use at the top of serializers.py!

- If you are nesting relationships between models in your output, make sure that
    you don't nest a pair of models within each other! This might happen if we wanted
    the Owner class to list its Vehicles and the Vehicle class to list its Owners.
    If we try to do this, we end nest objects recursively until our code crashes!
- Also be sure to order your serializers correctly! If we place a nested serializer
    below a class where it is nested, Django will think you haven't defined it and
    won't know where to find. Here, we placed our Owner serializer above the Vehicle
    serializer, because the Vehicle Serializer needs to know where the OwnerSerializer is 
    in order to use it.

Awesome! Now we've defined all of the information that we expect from our inputs
and outputs! But we still haven't defined *where* we can access and update information:
we need an endpoint. 

Let's head back to our views.py file to do just that. There's multiple ways to 
define our views here, but the best way to get the Django REST Framework to do
the heavy lifting is to use a `ModelViewSet`. This defines generic, create, retrieve,
update and delete functions for us and we only need to deviate if we want more specific
behavior.

First off, we import the models we use **and** the serializers we use. We also
import the `viewsets` module from `rest_framework` to use as a parent class:

{% highlight python %}
from .models import Owner, Vehicle
from .serializers import OwnerSerializer, VehicleSerializer

from rest_framework import viewsets
{% endhighlight %}

Then we define a *class* for each view. Django tends to start people off by using
function-based views, but we can also use class-based views too! There's a lot of advantages
to doing so, as they allow us to define generic sets of behavior and then extend them,
which leads to less repeated code. The Django documentation does a great job of explaining
class-based views, so I'll let them take it away [here](https://docs.djangoproject.com/en/1.11/topics/class-based-views/intro/).

Here's the code we'll used for our first class-based view:

{% highlight python %}
from .models import Owner, Vehicle
from .serializers import OwnerSerializer, VehicleSerializer

from rest_framework import viewsets

class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
{% endhighlight %}

This is super simple: we define our queryset and then we define the serializer to
export the data with, and we're done! We could go a little further though and filter
our queryset based on some parameter. Let's say we have added an `active` field in our
Vehicle model and we only want our output to include active Vehicles. Then, we
write a `get_queryset` function at the bottom of our class:

{% highlight python %}
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_queryset(self):
        """
        This view should return only active Vehicles.
        """
        active_vehicles = Vehicle.objects.filter(active=True)
        return active_vehicles
{% endhighlight %}

Note that even though we define the `get_queryset` function, the framework still
expects us to include the `queryset` above as well in the main part of the class.
Be sure to do both!

We're still missing another component: the actual URL! Let's head on over to urls.py.

Here we're going to register our views with a router object, in this case a `DefaultRouter`.
Then, we include the router in our usual `url_patterns` list. Check it out:

{% highlight python %}
from . import views
from django.conf.urls import url, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'owners', views.OwnerViewSet)

urlpatterns = [
    url(r'^', include(router.urls)),
]
{% endhighlight %}

Now, any time we want to access our vehicle data, we can point to our '/vehicles/'
URL and get exactly the information we want with a GET request. If we append a 
primary key to our URL, like '/vehicles/7', then we'll be able to see data on 
only that specific Vehicle or change it with a PUT, POST or DELETE request.

Great! Let's look at what we accomplished:

- We defined the fields we expect from our inputs and outputs in serializers.py
- We defined the data and querysets we pass to our serializers in views.py
- We defined the end point for receiving and sending data to and from our backend in urls.py
- We kept our data stored in exactly the same way in models.py!

There's also a ton of other options and cool ways of outputting our data, like pagination,
multiple serializers per model, and a UI for accessing you API. If you're interested in reading
more, I suggest you check out the [documentation](http://www.django-rest-framework.org/) 
for the Django Rest Framework!







